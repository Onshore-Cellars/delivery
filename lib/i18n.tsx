'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react'

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

  es: {
    'nav.search': 'Buscar rutas', 'nav.listSpace': 'Publicar espacio', 'nav.dashboard': 'Panel', 'nav.messages': 'Mensajes',
    'nav.community': 'Comunidad', 'nav.tracking': 'Seguimiento', 'nav.profile': 'Perfil', 'nav.login': 'Iniciar sesión',
    'nav.register': 'Comenzar', 'nav.logout': 'Cerrar sesión', 'nav.notifications': 'Notificaciones', 'nav.admin': 'Admin',
    'common.loading': 'Cargando...', 'common.save': 'Guardar', 'common.cancel': 'Cancelar', 'common.delete': 'Eliminar',
    'common.edit': 'Editar', 'common.close': 'Cerrar', 'common.back': 'Volver', 'common.next': 'Siguiente',
    'common.submit': 'Enviar', 'common.confirm': 'Confirmar', 'common.search': 'Buscar', 'common.filter': 'Filtrar',
    'common.sort': 'Ordenar', 'common.noResults': 'Sin resultados', 'common.viewAll': 'Ver todo',
    'common.required': 'Obligatorio', 'common.optional': 'Opcional',
    'auth.email': 'Correo electrónico', 'auth.password': 'Contraseña', 'auth.name': 'Nombre completo',
    'auth.signIn': 'Iniciar sesión', 'auth.signUp': 'Crear cuenta', 'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'auth.orContinueWith': 'o continuar con', 'auth.google': 'Continuar con Google',
    'auth.noAccount': '¿No tienes cuenta?', 'auth.hasAccount': '¿Ya tienes cuenta?',
    'booking.cargo': 'Descripción de la carga', 'booking.weight': 'Peso (kg)', 'booking.volume': 'Volumen (m³)',
    'booking.pickup': 'Recogida', 'booking.delivery': 'Entrega', 'booking.status': 'Estado',
    'booking.trackingCode': 'Código de seguimiento', 'booking.totalPrice': 'Precio total', 'booking.book': 'Reservar',
    'booking.timeWindow': 'Horario de entrega', 'booking.morning': 'Mañana (08:00–12:00)',
    'booking.afternoon': 'Tarde (12:00–17:00)', 'booking.evening': 'Noche (17:00–21:00)', 'booking.anytime': 'Cualquier hora',
    'listing.from': 'Desde', 'listing.to': 'Hasta', 'listing.departure': 'Salida', 'listing.capacity': 'Capacidad disponible',
    'listing.price': 'Precio', 'listing.perKg': 'por kg', 'listing.perM3': 'por m³', 'listing.flatRate': 'tarifa fija',
    'listing.biddingOpen': 'Pujas abiertas', 'listing.spotsLeft': 'plazas restantes',
    'dashboard.title': 'Panel', 'dashboard.activeBookings': 'Reservas activas', 'dashboard.completedDeliveries': 'Completadas',
    'dashboard.earnings': 'Ingresos', 'dashboard.rating': 'Valoración',
    'pod.title': 'Prueba de entrega', 'pod.takePhoto': 'Tomar foto', 'pod.uploadPhoto': 'Subir foto',
    'pod.signature': 'Firma', 'pod.recipientName': 'Nombre del destinatario', 'pod.notes': 'Notas', 'pod.confirmDelivery': 'Confirmar entrega',
    'review.leaveReview': 'Dejar una reseña', 'review.rating': 'Valoración', 'review.comment': 'Comentario',
    'footer.about': 'Acerca de', 'footer.terms': 'Términos', 'footer.privacy': 'Privacidad', 'footer.support': 'Soporte', 'footer.rights': 'Todos los derechos reservados.',
    'cookies.title': 'Preferencias de cookies', 'cookies.description': 'Usamos cookies para mejorar su experiencia. Las cookies esenciales son necesarias.',
    'cookies.acceptAll': 'Aceptar todo', 'cookies.customise': 'Personalizar', 'cookies.essentialOnly': 'Solo esenciales', 'cookies.save': 'Guardar preferencias',
    'addresses.title': 'Direcciones guardadas', 'addresses.add': 'Añadir dirección', 'addresses.label': 'Etiqueta', 'addresses.setDefault': 'Establecer por defecto',
    'recurring.title': 'Entregas recurrentes', 'recurring.weekly': 'Semanal', 'recurring.biweekly': 'Cada 2 semanas', 'recurring.monthly': 'Mensual', 'recurring.schedule': 'Programar',
  },

  it: {
    'nav.search': 'Cerca rotte', 'nav.listSpace': 'Pubblica spazio', 'nav.dashboard': 'Pannello', 'nav.messages': 'Messaggi',
    'nav.community': 'Comunità', 'nav.tracking': 'Tracciamento', 'nav.profile': 'Profilo', 'nav.login': 'Accedi',
    'nav.register': 'Inizia', 'nav.logout': 'Esci', 'nav.notifications': 'Notifiche', 'nav.admin': 'Admin',
    'common.loading': 'Caricamento...', 'common.save': 'Salva', 'common.cancel': 'Annulla', 'common.delete': 'Elimina',
    'common.edit': 'Modifica', 'common.close': 'Chiudi', 'common.back': 'Indietro', 'common.next': 'Avanti',
    'common.submit': 'Invia', 'common.confirm': 'Conferma', 'common.search': 'Cerca', 'common.filter': 'Filtra',
    'common.sort': 'Ordina', 'common.noResults': 'Nessun risultato', 'common.viewAll': 'Vedi tutto',
    'common.required': 'Obbligatorio', 'common.optional': 'Facoltativo',
    'auth.email': 'Email', 'auth.password': 'Password', 'auth.name': 'Nome completo',
    'auth.signIn': 'Accedi', 'auth.signUp': 'Crea account', 'auth.forgotPassword': 'Password dimenticata?',
    'auth.orContinueWith': 'o continua con', 'auth.google': 'Continua con Google',
    'auth.noAccount': 'Non hai un account?', 'auth.hasAccount': 'Hai già un account?',
    'booking.cargo': 'Descrizione del carico', 'booking.weight': 'Peso (kg)', 'booking.volume': 'Volume (m³)',
    'booking.pickup': 'Ritiro', 'booking.delivery': 'Consegna', 'booking.status': 'Stato',
    'booking.trackingCode': 'Codice di tracciamento', 'booking.totalPrice': 'Prezzo totale', 'booking.book': 'Prenota',
    'booking.timeWindow': 'Finestra di consegna', 'booking.morning': 'Mattina (08:00–12:00)',
    'booking.afternoon': 'Pomeriggio (12:00–17:00)', 'booking.evening': 'Sera (17:00–21:00)', 'booking.anytime': 'Qualsiasi orario',
    'listing.from': 'Da', 'listing.to': 'A', 'listing.departure': 'Partenza', 'listing.capacity': 'Capacità disponibile',
    'listing.price': 'Prezzo', 'listing.perKg': 'per kg', 'listing.perM3': 'per m³', 'listing.flatRate': 'tariffa fissa',
    'listing.biddingOpen': 'Offerte aperte', 'listing.spotsLeft': 'posti rimasti',
    'dashboard.title': 'Pannello', 'dashboard.activeBookings': 'Prenotazioni attive', 'dashboard.completedDeliveries': 'Completate',
    'dashboard.earnings': 'Guadagni', 'dashboard.rating': 'Valutazione',
    'pod.title': 'Prova di consegna', 'pod.takePhoto': 'Scatta foto', 'pod.uploadPhoto': 'Carica foto',
    'pod.signature': 'Firma', 'pod.recipientName': 'Nome destinatario', 'pod.notes': 'Note', 'pod.confirmDelivery': 'Conferma consegna',
    'review.leaveReview': 'Lascia una recensione', 'review.rating': 'Valutazione', 'review.comment': 'Commento',
    'footer.about': 'Chi siamo', 'footer.terms': 'Termini', 'footer.privacy': 'Privacy', 'footer.support': 'Supporto', 'footer.rights': 'Tutti i diritti riservati.',
    'cookies.title': 'Preferenze cookie', 'cookies.description': 'Utilizziamo cookie per migliorare la tua esperienza. I cookie essenziali sono necessari.',
    'cookies.acceptAll': 'Accetta tutto', 'cookies.customise': 'Personalizza', 'cookies.essentialOnly': 'Solo essenziali', 'cookies.save': 'Salva preferenze',
    'addresses.title': 'Indirizzi salvati', 'addresses.add': 'Aggiungi indirizzo', 'addresses.label': 'Etichetta', 'addresses.setDefault': 'Imposta come predefinito',
    'recurring.title': 'Consegne ricorrenti', 'recurring.weekly': 'Settimanale', 'recurring.biweekly': 'Ogni 2 settimane', 'recurring.monthly': 'Mensile', 'recurring.schedule': 'Programma',
  },

  el: {
    'nav.search': 'Αναζήτηση', 'nav.listSpace': 'Καταχώρηση', 'nav.dashboard': 'Πίνακας', 'nav.messages': 'Μηνύματα',
    'nav.community': 'Κοινότητα', 'nav.tracking': 'Παρακολούθηση', 'nav.profile': 'Προφίλ', 'nav.login': 'Σύνδεση',
    'nav.register': 'Εγγραφή', 'nav.logout': 'Αποσύνδεση', 'nav.notifications': 'Ειδοποιήσεις', 'nav.admin': 'Διαχείριση',
    'common.loading': 'Φόρτωση...', 'common.save': 'Αποθήκευση', 'common.cancel': 'Ακύρωση', 'common.delete': 'Διαγραφή',
    'common.edit': 'Επεξεργασία', 'common.close': 'Κλείσιμο', 'common.back': 'Πίσω', 'common.next': 'Επόμενο',
    'common.submit': 'Υποβολή', 'common.confirm': 'Επιβεβαίωση', 'common.search': 'Αναζήτηση', 'common.filter': 'Φίλτρο',
    'common.sort': 'Ταξινόμηση', 'common.noResults': 'Χωρίς αποτελέσματα', 'common.viewAll': 'Προβολή όλων',
    'common.required': 'Υποχρεωτικό', 'common.optional': 'Προαιρετικό',
    'auth.email': 'Email', 'auth.password': 'Κωδικός', 'auth.name': 'Ονοματεπώνυμο',
    'auth.signIn': 'Σύνδεση', 'auth.signUp': 'Δημιουργία λογαριασμού', 'auth.forgotPassword': 'Ξέχασες τον κωδικό;',
    'booking.cargo': 'Περιγραφή φορτίου', 'booking.weight': 'Βάρος (kg)', 'booking.volume': 'Όγκος (m³)',
    'booking.pickup': 'Παραλαβή', 'booking.delivery': 'Παράδοση', 'booking.status': 'Κατάσταση',
    'booking.book': 'Κράτηση', 'booking.totalPrice': 'Συνολική τιμή',
    'listing.from': 'Από', 'listing.to': 'Προς', 'listing.departure': 'Αναχώρηση', 'listing.capacity': 'Διαθέσιμη χωρητικότητα',
    'listing.price': 'Τιμή', 'listing.perKg': 'ανά kg', 'listing.perM3': 'ανά m³', 'listing.flatRate': 'πάγια τιμή',
    'footer.about': 'Σχετικά', 'footer.terms': 'Όροι', 'footer.privacy': 'Απόρρητο', 'footer.support': 'Υποστήριξη', 'footer.rights': 'Με επιφύλαξη παντός δικαιώματος.',
  },

  nl: {
    'nav.search': 'Zoek routes', 'nav.listSpace': 'Ruimte aanbieden', 'nav.dashboard': 'Dashboard', 'nav.messages': 'Berichten',
    'nav.community': 'Community', 'nav.tracking': 'Volgen', 'nav.profile': 'Profiel', 'nav.login': 'Inloggen',
    'nav.register': 'Aan de slag', 'nav.logout': 'Uitloggen', 'nav.notifications': 'Meldingen', 'nav.admin': 'Beheer',
    'common.loading': 'Laden...', 'common.save': 'Opslaan', 'common.cancel': 'Annuleren', 'common.delete': 'Verwijderen',
    'common.edit': 'Bewerken', 'common.close': 'Sluiten', 'common.back': 'Terug', 'common.next': 'Volgende',
    'common.submit': 'Verzenden', 'common.confirm': 'Bevestigen', 'common.search': 'Zoeken', 'common.filter': 'Filteren',
    'common.sort': 'Sorteren', 'common.noResults': 'Geen resultaten', 'common.viewAll': 'Alles bekijken',
    'common.required': 'Verplicht', 'common.optional': 'Optioneel',
    'auth.email': 'E-mail', 'auth.password': 'Wachtwoord', 'auth.name': 'Volledige naam',
    'auth.signIn': 'Inloggen', 'auth.signUp': 'Account aanmaken', 'auth.forgotPassword': 'Wachtwoord vergeten?',
    'booking.cargo': 'Lading omschrijving', 'booking.weight': 'Gewicht (kg)', 'booking.volume': 'Volume (m³)',
    'booking.pickup': 'Ophalen', 'booking.delivery': 'Levering', 'booking.status': 'Status',
    'booking.book': 'Boeken', 'booking.totalPrice': 'Totaalprijs',
    'listing.from': 'Van', 'listing.to': 'Naar', 'listing.departure': 'Vertrek', 'listing.capacity': 'Beschikbare capaciteit',
    'listing.price': 'Prijs', 'listing.perKg': 'per kg', 'listing.perM3': 'per m³', 'listing.flatRate': 'vast tarief',
    'footer.about': 'Over ons', 'footer.terms': 'Voorwaarden', 'footer.privacy': 'Privacy', 'footer.support': 'Ondersteuning', 'footer.rights': 'Alle rechten voorbehouden.',
  },

  de: {
    'nav.search': 'Routen suchen', 'nav.listSpace': 'Platz anbieten', 'nav.dashboard': 'Dashboard', 'nav.messages': 'Nachrichten',
    'nav.community': 'Community', 'nav.tracking': 'Sendungsverfolgung', 'nav.profile': 'Profil', 'nav.login': 'Anmelden',
    'nav.register': 'Loslegen', 'nav.logout': 'Abmelden', 'nav.notifications': 'Benachrichtigungen', 'nav.admin': 'Verwaltung',
    'common.loading': 'Wird geladen...', 'common.save': 'Speichern', 'common.cancel': 'Abbrechen', 'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten', 'common.close': 'Schließen', 'common.back': 'Zurück', 'common.next': 'Weiter',
    'common.submit': 'Absenden', 'common.confirm': 'Bestätigen', 'common.search': 'Suchen', 'common.filter': 'Filtern',
    'common.sort': 'Sortieren', 'common.noResults': 'Keine Ergebnisse', 'common.viewAll': 'Alle anzeigen',
    'common.required': 'Erforderlich', 'common.optional': 'Optional',
    'auth.email': 'E-Mail', 'auth.password': 'Passwort', 'auth.name': 'Vollständiger Name',
    'auth.signIn': 'Anmelden', 'auth.signUp': 'Konto erstellen', 'auth.forgotPassword': 'Passwort vergessen?',
    'booking.cargo': 'Frachtbeschreibung', 'booking.weight': 'Gewicht (kg)', 'booking.volume': 'Volumen (m³)',
    'booking.pickup': 'Abholung', 'booking.delivery': 'Lieferung', 'booking.status': 'Status',
    'booking.book': 'Buchen', 'booking.totalPrice': 'Gesamtpreis',
    'listing.from': 'Von', 'listing.to': 'Nach', 'listing.departure': 'Abfahrt', 'listing.capacity': 'Verfügbare Kapazität',
    'listing.price': 'Preis', 'listing.perKg': 'pro kg', 'listing.perM3': 'pro m³', 'listing.flatRate': 'Pauschalpreis',
    'footer.about': 'Über uns', 'footer.terms': 'AGB', 'footer.privacy': 'Datenschutz', 'footer.support': 'Support', 'footer.rights': 'Alle Rechte vorbehalten.',
  },

  pt: {
    'nav.search': 'Pesquisar rotas', 'nav.listSpace': 'Publicar espaço', 'nav.dashboard': 'Painel', 'nav.messages': 'Mensagens',
    'nav.community': 'Comunidade', 'nav.tracking': 'Rastreamento', 'nav.profile': 'Perfil', 'nav.login': 'Entrar',
    'nav.register': 'Começar', 'nav.logout': 'Sair', 'nav.notifications': 'Notificações', 'nav.admin': 'Admin',
    'common.loading': 'Carregando...', 'common.save': 'Salvar', 'common.cancel': 'Cancelar', 'common.delete': 'Excluir',
    'common.edit': 'Editar', 'common.close': 'Fechar', 'common.back': 'Voltar', 'common.next': 'Próximo',
    'common.submit': 'Enviar', 'common.confirm': 'Confirmar', 'common.search': 'Pesquisar', 'common.filter': 'Filtrar',
    'common.sort': 'Ordenar', 'common.noResults': 'Sem resultados', 'common.viewAll': 'Ver tudo',
    'auth.email': 'Email', 'auth.password': 'Senha', 'auth.name': 'Nome completo',
    'auth.signIn': 'Entrar', 'auth.signUp': 'Criar conta', 'auth.forgotPassword': 'Esqueceu a senha?',
    'booking.cargo': 'Descrição da carga', 'booking.weight': 'Peso (kg)', 'booking.volume': 'Volume (m³)',
    'booking.pickup': 'Recolha', 'booking.delivery': 'Entrega', 'booking.status': 'Estado',
    'booking.book': 'Reservar', 'booking.totalPrice': 'Preço total',
    'listing.from': 'De', 'listing.to': 'Para', 'listing.departure': 'Partida', 'listing.capacity': 'Capacidade disponível',
    'listing.price': 'Preço', 'listing.perKg': 'por kg', 'listing.perM3': 'por m³', 'listing.flatRate': 'tarifa fixa',
    'footer.about': 'Sobre', 'footer.terms': 'Termos', 'footer.privacy': 'Privacidade', 'footer.support': 'Suporte', 'footer.rights': 'Todos os direitos reservados.',
  },

  tr: {
    'nav.search': 'Rota ara', 'nav.listSpace': 'Alan yayınla', 'nav.dashboard': 'Panel', 'nav.messages': 'Mesajlar',
    'nav.community': 'Topluluk', 'nav.tracking': 'Takip', 'nav.profile': 'Profil', 'nav.login': 'Giriş yap',
    'nav.register': 'Başla', 'nav.logout': 'Çıkış yap', 'nav.notifications': 'Bildirimler', 'nav.admin': 'Yönetim',
    'common.loading': 'Yükleniyor...', 'common.save': 'Kaydet', 'common.cancel': 'İptal', 'common.delete': 'Sil',
    'common.edit': 'Düzenle', 'common.close': 'Kapat', 'common.back': 'Geri', 'common.next': 'İleri',
    'common.submit': 'Gönder', 'common.confirm': 'Onayla', 'common.search': 'Ara', 'common.filter': 'Filtrele',
    'common.sort': 'Sırala', 'common.noResults': 'Sonuç bulunamadı', 'common.viewAll': 'Tümünü gör',
    'auth.email': 'E-posta', 'auth.password': 'Şifre', 'auth.name': 'Ad Soyad',
    'auth.signIn': 'Giriş yap', 'auth.signUp': 'Hesap oluştur', 'auth.forgotPassword': 'Şifrenizi mi unuttunuz?',
    'booking.cargo': 'Kargo açıklaması', 'booking.weight': 'Ağırlık (kg)', 'booking.volume': 'Hacim (m³)',
    'booking.pickup': 'Teslim alma', 'booking.delivery': 'Teslimat', 'booking.status': 'Durum',
    'booking.book': 'Rezerve et', 'booking.totalPrice': 'Toplam fiyat',
    'listing.from': 'Nereden', 'listing.to': 'Nereye', 'listing.departure': 'Kalkış', 'listing.capacity': 'Mevcut kapasite',
    'listing.price': 'Fiyat', 'listing.perKg': '/kg', 'listing.perM3': '/m³', 'listing.flatRate': 'sabit ücret',
    'footer.about': 'Hakkında', 'footer.terms': 'Koşullar', 'footer.privacy': 'Gizlilik', 'footer.support': 'Destek', 'footer.rights': 'Tüm hakları saklıdır.',
  },

  hr: {
    'nav.search': 'Pretraži rute', 'nav.listSpace': 'Objavi prostor', 'nav.dashboard': 'Nadzorna ploča', 'nav.messages': 'Poruke',
    'nav.community': 'Zajednica', 'nav.tracking': 'Praćenje', 'nav.profile': 'Profil', 'nav.login': 'Prijava',
    'nav.register': 'Započni', 'nav.logout': 'Odjava', 'nav.notifications': 'Obavijesti', 'nav.admin': 'Administracija',
    'common.loading': 'Učitavanje...', 'common.save': 'Spremi', 'common.cancel': 'Odustani', 'common.delete': 'Obriši',
    'common.edit': 'Uredi', 'common.close': 'Zatvori', 'common.back': 'Natrag', 'common.next': 'Dalje',
    'common.submit': 'Pošalji', 'common.confirm': 'Potvrdi', 'common.search': 'Traži', 'common.filter': 'Filtriraj',
    'common.sort': 'Sortiraj', 'common.noResults': 'Nema rezultata', 'common.viewAll': 'Prikaži sve',
    'auth.email': 'E-pošta', 'auth.password': 'Lozinka', 'auth.name': 'Puno ime',
    'auth.signIn': 'Prijavi se', 'auth.signUp': 'Stvori račun', 'auth.forgotPassword': 'Zaboravljena lozinka?',
    'booking.cargo': 'Opis tereta', 'booking.weight': 'Težina (kg)', 'booking.volume': 'Obujam (m³)',
    'booking.pickup': 'Preuzimanje', 'booking.delivery': 'Dostava', 'booking.status': 'Status',
    'booking.book': 'Rezerviraj', 'booking.totalPrice': 'Ukupna cijena',
    'listing.from': 'Od', 'listing.to': 'Do', 'listing.departure': 'Polazak', 'listing.capacity': 'Dostupni kapacitet',
    'listing.price': 'Cijena', 'listing.perKg': 'po kg', 'listing.perM3': 'po m³', 'listing.flatRate': 'paušalna cijena',
    'footer.about': 'O nama', 'footer.terms': 'Uvjeti', 'footer.privacy': 'Privatnost', 'footer.support': 'Podrška', 'footer.rights': 'Sva prava pridržana.',
  },

  ar: {
    'nav.search': 'بحث عن مسارات', 'nav.listSpace': 'نشر مساحة', 'nav.dashboard': 'لوحة التحكم', 'nav.messages': 'الرسائل',
    'nav.community': 'المجتمع', 'nav.tracking': 'التتبع', 'nav.profile': 'الملف الشخصي', 'nav.login': 'تسجيل الدخول',
    'nav.register': 'ابدأ', 'nav.logout': 'تسجيل الخروج', 'nav.notifications': 'الإشعارات', 'nav.admin': 'الإدارة',
    'common.loading': 'جاري التحميل...', 'common.save': 'حفظ', 'common.cancel': 'إلغاء', 'common.delete': 'حذف',
    'common.edit': 'تعديل', 'common.close': 'إغلاق', 'common.back': 'رجوع', 'common.next': 'التالي',
    'common.submit': 'إرسال', 'common.confirm': 'تأكيد', 'common.search': 'بحث', 'common.filter': 'تصفية',
    'common.sort': 'ترتيب', 'common.noResults': 'لا توجد نتائج', 'common.viewAll': 'عرض الكل',
    'auth.email': 'البريد الإلكتروني', 'auth.password': 'كلمة المرور', 'auth.name': 'الاسم الكامل',
    'auth.signIn': 'تسجيل الدخول', 'auth.signUp': 'إنشاء حساب', 'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'booking.cargo': 'وصف الشحنة', 'booking.weight': 'الوزن (كجم)', 'booking.volume': 'الحجم (م³)',
    'booking.pickup': 'الاستلام', 'booking.delivery': 'التوصيل', 'booking.status': 'الحالة',
    'booking.book': 'حجز', 'booking.totalPrice': 'السعر الإجمالي',
    'listing.from': 'من', 'listing.to': 'إلى', 'listing.departure': 'المغادرة', 'listing.capacity': 'السعة المتاحة',
    'listing.price': 'السعر', 'listing.perKg': 'لكل كجم', 'listing.perM3': 'لكل م³', 'listing.flatRate': 'سعر ثابت',
    'footer.about': 'عن الموقع', 'footer.terms': 'الشروط', 'footer.privacy': 'الخصوصية', 'footer.support': 'الدعم', 'footer.rights': 'جميع الحقوق محفوظة.',
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
  const [aiTranslations, setAiTranslations] = useState<Record<string, string>>({})
  const pendingKeys = useRef<Set<string>>(new Set())
  const batchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supported: Locale[] = ['en','fr','es','it','el','nl','de','pt','tr','hr','ar']
    const stored = localStorage.getItem('od_locale') as Locale | null
    if (stored && supported.includes(stored)) {
      setLocaleState(stored)
    } else {
      const browserLang = navigator.language.slice(0, 2) as Locale
      if (supported.includes(browserLang)) setLocaleState(browserLang)
    }
  }, [])

  // Clear AI translations when locale changes
  useEffect(() => {
    setAiTranslations({})
    pendingKeys.current.clear()
  }, [locale])

  // Batch AI translation for missing keys
  const requestAiTranslation = useCallback((key: string, englishText: string) => {
    if (locale === 'en') return
    const cacheKey = `${locale}:${key}`
    if (aiTranslations[cacheKey] || pendingKeys.current.has(cacheKey)) return

    pendingKeys.current.add(cacheKey)

    if (batchTimeout.current) clearTimeout(batchTimeout.current)
    batchTimeout.current = setTimeout(async () => {
      const keys = Array.from(pendingKeys.current)
      if (keys.length === 0) return

      // Extract English texts for the pending keys
      const textsToTranslate = keys.map(k => {
        const origKey = k.split(':').slice(1).join(':')
        return translations.en[origKey] || origKey
      })

      try {
        const res = await fetch('/api/ai/translate/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: textsToTranslate.slice(0, 50), targetLang: locale }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.translations && data.translations.length === keys.slice(0, 50).length) {
            setAiTranslations(prev => {
              const next = { ...prev }
              keys.slice(0, 50).forEach((k, i) => {
                next[k] = data.translations[i]
              })
              return next
            })
          }
        }
      } catch {
        // Silently fail — English fallback is fine
      }

      keys.forEach(k => pendingKeys.current.delete(k))
    }, 500)
  }, [locale, aiTranslations])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('od_locale', l)
    document.documentElement.lang = l
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    // 1. Try static dictionary for current locale
    let str = translations[locale]?.[key]

    // 2. Try AI-translated cache
    if (!str) {
      const cacheKey = `${locale}:${key}`
      str = aiTranslations[cacheKey]
    }

    // 3. Fall back to English
    if (!str) {
      str = translations.en[key] || key
      // Request AI translation for missing key (non-English)
      if (locale !== 'en' && translations.en[key]) {
        requestAiTranslation(key, translations.en[key])
      }
    }

    if (params && str) {
      Object.entries(params).forEach(([k, v]) => {
        str = str!.replace(`{${k}}`, String(v))
      })
    }
    return str || key
  }, [locale, aiTranslations, requestAiTranslation])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
