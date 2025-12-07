/* ============================================
   VALIDATION - Validation des formulaires
   ============================================ */

/**
 * Valide un champ prénom
 * @param {string} prenom - Prénom à valider
 * @returns {Object} - { valid: boolean, error: string }
 */
function validatePrenom(prenom) {
    const rules = VALIDATION_RULES.prenom;
    
    if (!prenom || prenom.trim().length === 0) {
        return { valid: false, error: 'Le prénom est requis' };
    }
    
    if (prenom.trim().length < rules.minLength) {
        return { valid: false, error: rules.errorMessage };
    }
    
    if (prenom.trim().length > rules.maxLength) {
        return { valid: false, error: `Le prénom ne peut pas dépasser ${rules.maxLength} caractères` };
    }
    
    if (!rules.pattern.test(prenom.trim())) {
        return { valid: false, error: rules.errorMessage };
    }
    
    return { valid: true, error: '' };
}

/**
 * Valide un champ nom
 * @param {string} nom - Nom à valider
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateNom(nom) {
    const rules = VALIDATION_RULES.nom;
    
    if (!nom || nom.trim().length === 0) {
        return { valid: false, error: 'Le nom est requis' };
    }
    
    if (nom.trim().length < rules.minLength) {
        return { valid: false, error: rules.errorMessage };
    }
    
    if (nom.trim().length > rules.maxLength) {
        return { valid: false, error: `Le nom ne peut pas dépasser ${rules.maxLength} caractères` };
    }
    
    if (!rules.pattern.test(nom.trim())) {
        return { valid: false, error: rules.errorMessage };
    }
    
    return { valid: true, error: '' };
}

/**
 * Valide un email
 * @param {string} email - Email à valider
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateEmail(email) {
    const rules = VALIDATION_RULES.email;
    
    if (!email || email.trim().length === 0) {
        return { valid: false, error: 'L\'email est requis' };
    }
    
    if (!rules.pattern.test(email.trim())) {
        return { valid: false, error: rules.errorMessage };
    }
    
    return { valid: true, error: '' };
}

/**
 * Valide un numéro de téléphone français
 * @param {string} telephone - Téléphone à valider
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateTelephone(telephone) {
    const rules = VALIDATION_RULES.telephone;
    
    if (!telephone || telephone.trim().length === 0) {
        return { valid: false, error: 'Le téléphone est requis' };
    }
    
    // Nettoyer (retirer les espaces)
    const cleaned = telephone.replace(/\s/g, '');
    
    // Vérifier le format nettoyé
    if (!rules.pattern.test(cleaned)) {
        return { valid: false, error: rules.errorMessage };
    }
    
    return { valid: true, error: '' };
}

/**
 * Valide le nombre de paniers
 * @param {number|string} nombrePaniers - Nombre de paniers
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateNombrePaniers(nombrePaniers) {
    const rules = VALIDATION_RULES.nombrePaniers;
    
    const num = parseInt(nombrePaniers, 10);
    
    if (isNaN(num)) {
        return { valid: false, error: 'Le nombre de paniers doit être un nombre' };
    }
    
    if (num < rules.min) {
        return { valid: false, error: rules.errorMessage };
    }
    
    if (num > rules.max) {
        return { valid: false, error: rules.errorMessage };
    }
    
    return { valid: true, error: '' };
}

/**
 * Valide une date de récupération
 * @param {string} dateRecuperation - Date au format YYYY-MM-DD ou DD/MM/YYYY
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateDateRecuperation(dateRecuperation) {
    const rules = VALIDATION_RULES.dateRecuperation;
    
    if (!dateRecuperation || dateRecuperation.trim().length === 0) {
        return { valid: false, error: 'La date de récupération est requise' };
    }
    
    let date;
    
    // Si c'est au format YYYY-MM-DD (input type="date")
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateRecuperation)) {
        date = new Date(dateRecuperation);
    }
    // Si c'est au format DD/MM/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateRecuperation)) {
        const [day, month, year] = dateRecuperation.split('/');
        date = new Date(`${year}-${month}-${day}`);
    }
    else {
        return { valid: false, error: 'Format de date invalide' };
    }
    
    // Vérifier que c'est une date valide
    if (isNaN(date.getTime())) {
        return { valid: false, error: 'Date invalide' };
    }
    
    // Vérifier que la date n'est pas dans le passé
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date < today) {
        return { valid: false, error: rules.errorMessage };
    }
    
    return { valid: true, error: '' };
}

/**
 * Valide un état de commande
 * @param {string} etat - État à valider
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateEtat(etat) {
    const validStates = Object.values(ORDER_STATES);
    
    if (!validStates.includes(etat)) {
        return { 
            valid: false, 
            error: `État invalide. Valeurs acceptées : ${validStates.join(', ')}` 
        };
    }
    
    return { valid: true, error: '' };
}

/**
 * Valide l'ensemble du formulaire
 * @param {Object} formData - Données du formulaire
 * @returns {Object} - { valid: boolean, errors: Object }
 */
function validateOrderForm(formData) {
    const errors = {};
    let isValid = true;
    
    // Validation prénom
    const prenomResult = validatePrenom(formData.prenom);
    if (!prenomResult.valid) {
        errors.prenom = prenomResult.error;
        isValid = false;
    }
    
    // Validation nom
    const nomResult = validateNom(formData.nom);
    if (!nomResult.valid) {
        errors.nom = nomResult.error;
        isValid = false;
    }
    
    // Validation email
    const emailResult = validateEmail(formData.email);
    if (!emailResult.valid) {
        errors.email = emailResult.error;
        isValid = false;
    }
    
    // Validation téléphone
    const telephoneResult = validateTelephone(formData.telephone);
    if (!telephoneResult.valid) {
        errors.telephone = telephoneResult.error;
        isValid = false;
    }
    
    // Validation nombre de paniers
    const paniersResult = validateNombrePaniers(formData.nombrePaniers);
    if (!paniersResult.valid) {
        errors.nombrePaniers = paniersResult.error;
        isValid = false;
    }
    
    // Validation date de récupération
    const dateResult = validateDateRecuperation(formData.dateRecuperation);
    if (!dateResult.valid) {
        errors.dateRecuperation = dateResult.error;
        isValid = false;
    }
    
    // Validation état (optionnel)
    if (formData.etat) {
        const etatResult = validateEtat(formData.etat);
        if (!etatResult.valid) {
            errors.etat = etatResult.error;
            isValid = false;
        }
    }
    
    return { valid: isValid, errors };
}

/**
 * Formate un numéro de téléphone (ajoute des espaces)
 * @param {string} telephone - Téléphone à formater
 * @returns {string} - Téléphone formaté (ex: "06 12 34 56 78")
 */
function formatTelephone(telephone) {
    // Retirer tous les espaces
    const cleaned = telephone.replace(/\s/g, '');
    
    // Ajouter des espaces tous les 2 chiffres après le premier
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    
    return telephone;
}

/**
 * Nettoie les données du formulaire avant envoi
 * @param {Object} formData - Données brutes du formulaire
 * @returns {Object} - Données nettoyées
 */
function sanitizeFormData(formData) {
    return {
        prenom: formData.prenom.trim(),
        nom: formData.nom.trim(),
        email: formData.email.trim().toLowerCase(),
        telephone: formData.telephone.replace(/\s/g, ''), // Retirer les espaces
        nombrePaniers: parseInt(formData.nombrePaniers, 10),
        dateRecuperation: formData.dateRecuperation,
        etat: formData.etat || ORDER_STATES.PENDING
    };
}

// Export des fonctions pour les tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validatePrenom,
        validateNom,
        validateEmail,
        validateTelephone,
        validateNombrePaniers,
        validateDateRecuperation,
        validateEtat,
        validateOrderForm,
        formatTelephone,
        sanitizeFormData
    };
}

console.log('✅ Module Validation chargé');

