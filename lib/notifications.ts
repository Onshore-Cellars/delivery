import prisma from './prisma'
import { sendEmail, bookingConfirmationEmail, statusUpdateEmail, newMessageEmail, bidReceivedEmail, alertMatchEmail } from './email'
import { NotificationType } from '@prisma/client'
import { sendSMSNotification, formatSMSUpdate } from './sms'
import { generateAlertEmail } from './ai'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  linkUrl?: string
  metadata?: Record<string, unknown>
  sendEmailNotification?: boolean
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, linkUrl, metadata, sendEmailNotification = true } = params

  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        linkUrl: linkUrl || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // Send email if user has email notifications enabled
    if (sendEmailNotification) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true, phone: true, emailNotifications: true, smsNotifications: true },
        })

        if (user?.emailNotifications) {
          await sendEmail({
            to: user.email,
            subject: title,
            html: `<p>Hi ${user.name},</p><p>${message}</p>`,
          })
          await prisma.notification.update({
            where: { id: notification.id },
            data: { emailSent: true },
          })
        }

        // Send SMS if user has it enabled (free via email-to-SMS gateway)
        if (user?.smsNotifications && user?.phone) {
          try {
            const smsSent = await sendSMSNotification(
              { phone: user.phone, smsNotifications: true },
              message.slice(0, 160),
              title,
            )
            if (smsSent) {
              await prisma.notification.update({
                where: { id: notification.id },
                data: { smsSent: true },
              })
            }
          } catch (smsError) {
            console.error('Failed to send SMS notification:', smsError)
          }
        }
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError)
      }
    }

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

// ─── SPECIFIC NOTIFICATION HELPERS ────────────────────────────────────────────

export async function notifyBookingCreated(booking: {
  id: string
  trackingCode: string
  cargoDescription: string
  totalPrice: number
  currency: string
  shipperId: string
  pickupAddress?: string | null
  pickupContact?: string | null
  pickupPhone?: string | null
  pickupTimeWindow?: string | null
  deliveryAddress?: string | null
  deliveryContact?: string | null
  deliveryPhone?: string | null
  listing: {
    title: string
    originPort: string
    destinationPort: string
    departureDate: Date
    carrierId: string
    carrier: { name: string; email: string; emailNotifications: boolean }
  }
  shipper: { name: string; email: string; emailNotifications: boolean }
}) {
  const symbols: Record<string, string> = { EUR: '\u20AC', GBP: '\u00A3', USD: '$' }
  const priceStr = `${symbols[booking.currency] || booking.currency}${booking.totalPrice.toFixed(2)}`

  // Notify shipper
  await createNotification({
    userId: booking.shipperId,
    type: 'BOOKING_CREATED',
    title: 'Booking Confirmed',
    message: `Your booking for ${booking.listing.title} has been created. Tracking: ${booking.trackingCode}`,
    linkUrl: `/tracking?code=${booking.trackingCode}`,
    sendEmailNotification: false, // We'll send a proper template
  })

  if (booking.shipper.emailNotifications) {
    const template = bookingConfirmationEmail({
      customerName: booking.shipper.name,
      trackingCode: booking.trackingCode,
      origin: booking.listing.originPort,
      destination: booking.listing.destinationPort,
      departureDate: booking.listing.departureDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      cargoDescription: booking.cargoDescription,
      totalPrice: priceStr,
    })
    await sendEmail({ to: booking.shipper.email, ...template })
  }

  // Notify carrier with collection & delivery details
  const pickupInfo = booking.pickupAddress
    ? `\nCollection: ${booking.pickupAddress}${booking.pickupContact ? ` (${booking.pickupContact})` : ''}${booking.pickupPhone ? ` Tel: ${booking.pickupPhone}` : ''}${booking.pickupTimeWindow ? ` — ${booking.pickupTimeWindow}` : ''}`
    : ''
  const deliveryInfo = booking.deliveryAddress
    ? `\nDelivery: ${booking.deliveryAddress}${booking.deliveryContact ? ` (${booking.deliveryContact})` : ''}${booking.deliveryPhone ? ` Tel: ${booking.deliveryPhone}` : ''}`
    : ''

  await createNotification({
    userId: booking.listing.carrierId,
    type: 'BOOKING_CREATED',
    title: 'New Booking Received',
    message: `${booking.shipper.name} booked space on ${booking.listing.title} (${priceStr})${pickupInfo}${deliveryInfo}`,
    linkUrl: '/dashboard',
  })
}

export async function notifyStatusUpdate(data: {
  bookingId: string
  status: string
  description: string
  location?: string
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    include: {
      shipper: { select: { id: true, name: true, email: true, emailNotifications: true } },
      listing: {
        select: { carrierId: true, carrier: { select: { id: true, name: true } } },
      },
    },
  })

  if (!booking) return

  // Notify shipper
  await createNotification({
    userId: booking.shipper.id,
    type: 'BOOKING_STATUS_UPDATE',
    title: `Shipment ${data.status.replace('_', ' ')}`,
    message: data.description,
    linkUrl: `/tracking?code=${booking.trackingCode}`,
    sendEmailNotification: false,
  })

  if (booking.shipper.emailNotifications && booking.trackingCode) {
    const template = statusUpdateEmail({
      customerName: booking.shipper.name,
      trackingCode: booking.trackingCode,
      status: data.status,
      description: data.description,
      location: data.location,
    })
    await sendEmail({ to: booking.shipper.email, ...template })
  }

  // Send SMS for status updates (free)
  if (booking.trackingCode) {
    const shipper = await prisma.user.findUnique({
      where: { id: booking.shipper.id },
      select: { phone: true, smsNotifications: true },
    })
    if (shipper) {
      await sendSMSNotification(
        shipper,
        formatSMSUpdate(data.status, booking.trackingCode, data.description),
      )
    }
  }
}

export async function notifyNewMessage(data: {
  recipientId: string
  senderId: string
  preview: string
}) {
  const [recipient, sender] = await Promise.all([
    prisma.user.findUnique({ where: { id: data.recipientId }, select: { name: true, email: true, emailNotifications: true } }),
    prisma.user.findUnique({ where: { id: data.senderId }, select: { name: true } }),
  ])

  if (!recipient || !sender) return

  await createNotification({
    userId: data.recipientId,
    type: 'MESSAGE_RECEIVED',
    title: `Message from ${sender.name}`,
    message: data.preview.slice(0, 100),
    linkUrl: '/messages',
    sendEmailNotification: false,
  })

  if (recipient.emailNotifications) {
    const template = newMessageEmail({
      recipientName: recipient.name,
      senderName: sender.name,
      preview: data.preview.slice(0, 200),
    })
    await sendEmail({ to: recipient.email, ...template })
  }
}

export async function notifyBidReceived(data: {
  carrierId: string
  bidderName: string
  amount: number
  currency: string
  listingTitle: string
  weightKg: number
  volumeM3: number
}) {
  const carrier = await prisma.user.findUnique({
    where: { id: data.carrierId },
    select: { name: true, email: true, emailNotifications: true },
  })

  if (!carrier) return

  const symbols: Record<string, string> = { EUR: '\u20AC', GBP: '\u00A3', USD: '$' }
  const amountStr = `${symbols[data.currency] || data.currency}${data.amount.toFixed(2)}`

  await createNotification({
    userId: data.carrierId,
    type: 'BID_RECEIVED',
    title: 'New Bid Received',
    message: `${data.bidderName} bid ${amountStr} on ${data.listingTitle}`,
    linkUrl: '/dashboard',
    sendEmailNotification: false,
  })

  if (carrier.emailNotifications) {
    const template = bidReceivedEmail({
      carrierName: carrier.name,
      bidderName: data.bidderName,
      amount: amountStr,
      listingTitle: data.listingTitle,
      weightKg: data.weightKg,
      volumeM3: data.volumeM3,
    })
    await sendEmail({ to: carrier.email, ...template })
  }
}

// ─── LISTING ALERT TRIGGER ─────────────────────────────────────────────────

export async function triggerListingAlerts(listing: {
  id: string
  title: string
  listingType: string
  originPort: string
  destinationPort: string
  departureDate: Date
  totalCapacityKg: number
  totalCapacityM3: number
  pricePerKg: number | null
  flatRate: number | null
  vehicleType: string
  currency: string
  carrierId: string
  hasRefrigeration: boolean
  routeDirection: string
  originLat?: number | null
  originLng?: number | null
  destinationLat?: number | null
  destinationLng?: number | null
}) {
  try {
    const { sendPushToUser } = await import('@/lib/push')

    const alerts = await prisma.savedAlert.findMany({
      where: { active: true },
      include: { user: { select: { id: true, name: true, email: true, emailNotifications: true } } },
    })

    const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    for (const alert of alerts) {
      // Don't alert the listing creator
      if (alert.userId === listing.carrierId) continue

      // Check listing type
      if (alert.listingType && alert.listingType !== listing.listingType) continue

      // Check vehicle type
      if (alert.vehicleType && alert.vehicleType !== listing.vehicleType) continue

      // Check date range
      if (alert.dateFrom && listing.departureDate < alert.dateFrom) continue
      if (alert.dateTo && listing.departureDate > alert.dateTo) continue

      // Check minimum capacity
      if (alert.minCapacityKg && listing.totalCapacityKg < alert.minCapacityKg) continue

      // Check origin proximity (Haversine if coordinates available, otherwise case-insensitive contains)
      if (alert.originPort) {
        if (alert.originLat && alert.originLng && listing.originLat && listing.originLng) {
          const dist = haversine(alert.originLat, alert.originLng, listing.originLat, listing.originLng)
          if (dist > alert.radiusKm) continue
        } else if (!listing.originPort.toLowerCase().includes(alert.originPort.toLowerCase())) {
          continue
        }
      }

      // Check destination proximity
      if (alert.destinationPort) {
        if (alert.destLat && alert.destLng && listing.destinationLat && listing.destinationLng) {
          const dist = haversine(alert.destLat, alert.destLng, listing.destinationLat, listing.destinationLng)
          if (dist > alert.radiusKm) continue
        } else if (!listing.destinationPort.toLowerCase().includes(alert.destinationPort.toLowerCase())) {
          continue
        }
      }

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: alert.userId,
          type: 'RETURN_ROUTE_AVAILABLE',
          title: 'New listing matches your alert',
          message: `${listing.originPort} → ${listing.destinationPort} · ${alert.name || 'Your saved search'}`,
          linkUrl: `/listings/${listing.id}`,
        },
      })

      // Send push notification
      if (alert.pushEnabled) {
        await sendPushToUser(alert.userId, {
          title: 'Route Alert Match',
          body: `New listing: ${listing.originPort} → ${listing.destinationPort}`,
          url: `/listings/${listing.id}`,
          tag: `alert-${alert.id}`,
        })
      }

      // Send AI-generated email if enabled
      if (alert.emailEnabled && alert.user.emailNotifications && alert.user.email) {
        try {
          const emailContent = await generateAlertEmail({
            userName: alert.user.name,
            listingTitle: listing.title,
            originPort: listing.originPort,
            destinationPort: listing.destinationPort,
            departureDate: listing.departureDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            vehicleType: listing.vehicleType,
            capacityKg: listing.totalCapacityKg,
            capacityM3: listing.totalCapacityM3,
            pricePerKg: listing.pricePerKg,
            flatRate: listing.flatRate,
            currency: listing.currency,
            hasRefrigeration: listing.hasRefrigeration,
            listingType: listing.listingType,
            alertName: alert.name,
          })

          if (emailContent) {
            const template = alertMatchEmail({
              userName: alert.user.name,
              subject: emailContent.subject,
              body: emailContent.body,
              listingId: listing.id,
              alertName: alert.name,
            })
            await sendEmail({ to: alert.user.email, ...template })
          }
        } catch (emailErr) {
          console.error(`Failed to send alert email to ${alert.user.email}:`, emailErr)
        }
      }

      // Update alert stats
      await prisma.savedAlert.update({
        where: { id: alert.id },
        data: { lastTriggeredAt: new Date(), triggerCount: { increment: 1 } },
      })
    }
  } catch (err) {
    console.error('Alert trigger failed:', err)
  }
}
