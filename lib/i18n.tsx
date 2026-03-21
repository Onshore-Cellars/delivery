'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────

export type Locale = 'en' | 'fr' | 'es' | 'it' | 'el' | 'nl' | 'de' | 'pt' | 'tr' | 'hr' | 'ar'

const translations: Partial<Record<Locale, Record<string, string>>> & { en: Record<string, string> } = {
  en: {
    // Navigation
    'nav.search': 'Search Routes',
    'nav.listSpace': 'List Space',
    'nav.dashboard': 'Dashboard',
    'nav.messages': 'Messages',
    'nav.community': 'Community',
    'nav.tracking': 'Track',
    'nav.profile': 'Profile',
    'nav.login': 'Sign In',
    'nav.register': 'Get Started',
    'nav.logout': 'Sign Out',
    'nav.notifications': 'Notifications',
    'nav.admin': 'Admin',

    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.submit': 'Submit',
    'common.confirm': 'Confirm',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.noResults': 'No results found',
    'common.viewAll': 'View All',
    'common.required': 'Required',
    'common.optional': 'Optional',

    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Create Account',
    'auth.forgotPassword': 'Forgot password?',
    'auth.orContinueWith': 'or continue with',
    'auth.google': 'Continue with Google',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',

    // Booking
    'booking.cargo': 'Cargo Description',
    'booking.weight': 'Weight (kg)',
    'booking.volume': 'Volume (m³)',
    'booking.pickup': 'Pickup',
    'booking.delivery': 'Delivery',
    'booking.status': 'Status',
    'booking.trackingCode': 'Tracking Code',
    'booking.totalPrice': 'Total Price',
    'booking.book': 'Book Now',
    'booking.timeWindow': 'Delivery Time Window',
    'booking.morning': 'Morning (08:00–12:00)',
    'booking.afternoon': 'Afternoon (12:00–17:00)',
    'booking.evening': 'Evening (17:00–21:00)',
    'booking.anytime': 'Any Time',

    // Listing
    'listing.from': 'From',
    'listing.to': 'To',
    'listing.departure': 'Departure',
    'listing.capacity': 'Available Capacity',
    'listing.price': 'Price',
    'listing.perKg': 'per kg',
    'listing.perM3': 'per m³',
    'listing.flatRate': 'flat rate',
    'listing.biddingOpen': 'Bidding Open',
    'listing.spotsLeft': 'spots left',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.activeBookings': 'Active Bookings',
    'dashboard.completedDeliveries': 'Completed',
    'dashboard.earnings': 'Earnings',
    'dashboard.rating': 'Rating',

    // POD
    'pod.title': 'Proof of Delivery',
    'pod.takePhoto': 'Take Photo',
    'pod.uploadPhoto': 'Upload Photo',
    'pod.signature': 'Signature',
    'pod.recipientName': 'Recipient Name',
    'pod.notes': 'Notes',
    'pod.confirmDelivery': 'Confirm Delivery',

    // Reviews
    'review.leaveReview': 'Leave a Review',
    'review.rating': 'Rating',
    'review.comment': 'Comment',

    // Footer
    'footer.about': 'About',
    'footer.terms': 'Terms',
    'footer.privacy': 'Privacy',
    'footer.support': 'Support',
    'footer.rights': 'All rights reserved.',

    // Cookie consent
    'cookies.title': 'Cookie Preferences',
    'cookies.description': 'We use cookies to improve your experience. Essential cookies are required for the site to function.',
    'cookies.acceptAll': 'Accept All',
    'cookies.customise': 'Customise',
    'cookies.essentialOnly': 'Essential Only',
    'cookies.save': 'Save Preferences',

    // Saved addresses
    'addresses.title': 'Saved Addresses',
    'addresses.add': 'Add Address',
    'addresses.label': 'Label',
    'addresses.setDefault': 'Set as Default',

    // Recurring
    'recurring.title': 'Recurring Deliveries',
    'recurring.weekly': 'Weekly',
    'recurring.biweekly': 'Every 2 Weeks',
    'recurring.monthly': 'Monthly',
    'recurring.schedule': 'Schedule',
  },

  fr: {
    // Navigation
    'nav.search': 'Rechercher',
    'nav.listSpace': 'Proposer un espace',
    'nav.dashboard': 'Tableau de bord',
    'nav.messages': 'Messages',
    'nav.community': 'Communauté',
    'nav.tracking': 'Suivi',
    'nav.profile': 'Profil',
    'nav.login': 'Connexion',
    'nav.register': 'Commencer',
    'nav.logout': 'Déconnexion',
    'nav.notifications': 'Notifications',
    'nav.admin': 'Admin',

    // Common
    'common.loading': 'Chargement...',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.close': 'Fermer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.submit': 'Envoyer',
    'common.confirm': 'Confirmer',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.sort': 'Trier',
    'common.noResults': 'Aucun résultat',
    'common.viewAll': 'Voir tout',
    'common.required': 'Obligatoire',
    'common.optional': 'Facultatif',

    // Auth
    'auth.email': 'E-mail',
    'auth.password': 'Mot de passe',
    'auth.name': 'Nom complet',
    'auth.signIn': 'Se connecter',
    'auth.signUp': 'Créer un compte',
    'auth.forgotPassword': 'Mot de passe oublié ?',
    'auth.orContinueWith': 'ou continuer avec',
    'auth.google': 'Continuer avec Google',
    'auth.noAccount': "Pas encore de compte ?",
    'auth.hasAccount': 'Déjà un compte ?',

    // Booking
    'booking.cargo': 'Description du cargo',
    'booking.weight': 'Poids (kg)',
    'booking.volume': 'Volume (m³)',
    'booking.pickup': 'Enlèvement',
    'booking.delivery': 'Livraison',
    'booking.status': 'Statut',
    'booking.trackingCode': 'Code de suivi',
    'booking.totalPrice': 'Prix total',
    'booking.book': 'Réserver',
    'booking.timeWindow': 'Créneau de livraison',
    'booking.morning': 'Matin (08h00–12h00)',
    'booking.afternoon': 'Après-midi (12h00–17h00)',
    'booking.evening': 'Soir (17h00–21h00)',
    'booking.anytime': 'Toute la journée',

    // Listing
    'listing.from': 'De',
    'listing.to': 'À',
    'listing.departure': 'Départ',
    'listing.capacity': 'Capacité disponible',
    'listing.price': 'Prix',
    'listing.perKg': 'par kg',
    'listing.perM3': 'par m³',
    'listing.flatRate': 'forfait',
    'listing.biddingOpen': 'Enchères ouvertes',
    'listing.spotsLeft': 'places restantes',

    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.activeBookings': 'Réservations actives',
    'dashboard.completedDeliveries': 'Terminées',
    'dashboard.earnings': 'Revenus',
    'dashboard.rating': 'Note',

    // POD
    'pod.title': 'Preuve de livraison',
    'pod.takePhoto': 'Prendre une photo',
    'pod.uploadPhoto': 'Télécharger une photo',
    'pod.signature': 'Signature',
    'pod.recipientName': 'Nom du destinataire',
    'pod.notes': 'Notes',
    'pod.confirmDelivery': 'Confirmer la livraison',

    // Reviews
    'review.leaveReview': 'Laisser un avis',
    'review.rating': 'Note',
    'review.comment': 'Commentaire',

    // Footer
    'footer.about': 'À propos',
    'footer.terms': 'Conditions',
    'footer.privacy': 'Confidentialité',
    'footer.support': 'Support',
    'footer.rights': 'Tous droits réservés.',

    // Cookie consent
    'cookies.title': 'Préférences de cookies',
    'cookies.description': 'Nous utilisons des cookies pour améliorer votre expérience. Les cookies essentiels sont nécessaires au fonctionnement du site.',
    'cookies.acceptAll': 'Tout accepter',
    'cookies.customise': 'Personnaliser',
    'cookies.essentialOnly': 'Essentiels uniquement',
    'cookies.save': 'Enregistrer les préférences',

    // Saved addresses
    'addresses.title': 'Adresses enregistrées',
    'addresses.add': 'Ajouter une adresse',
    'addresses.label': 'Libellé',
    'addresses.setDefault': 'Définir par défaut',

    // Recurring
    'recurring.title': 'Livraisons récurrentes',
    'recurring.weekly': 'Hebdomadaire',
    'recurring.biweekly': 'Toutes les 2 semaines',
    'recurring.monthly': 'Mensuel',
    'recurring.schedule': 'Planifier',
  },
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const stored = localStorage.getItem('od_locale') as Locale | null
    if (stored && (stored === 'en' || stored === 'fr')) {
      setLocaleState(stored)
    } else {
      // Auto-detect from browser
      const browserLang = navigator.language.slice(0, 2)
      if (browserLang === 'fr') setLocaleState('fr')
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('od_locale', l)
    document.documentElement.lang = l
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let str = translations[locale]?.[key] || translations.en[key] || key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
    }
    return str
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
