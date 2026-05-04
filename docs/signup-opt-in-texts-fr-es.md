# Textes d’opt-in — inscription (case à cocher)

**Objectif** : distinguer clairement **communications obligatoires** liées au compte, au paiement et à la sécurité, et **communications marketing / parcours client (lifecycle)** soumises au **consentement** (opt-in case à cocher non précochée par défaut — à implémenter côté formulaire).

---

## Français (FR)

**Libellé de la case (recommandé, une seule case « marketing »)**  

> J’accepte de recevoir des **communications personnalisées** d’Alexandra (FitMangas) : conseils bien-être, actualités des cours, offres ponctuelles et contenus inspirants. Je peux **me désinscrire à tout moment** via le lien dans chaque message ou depuis mon espace client.  

**Texte d’information affiché à côté ou sous la case (obligations + transactionnel)**  

> Même si je ne coche pas cette case, je recevrai les **emails indispensables** au bon fonctionnement du service : confirmation de compte, sécurité (réinitialisation de mot de passe), confirmations et reçus de **paiement (Stripe)**, rappels liés à mes **réservations ou abonnements**, et messages liés à l’**exécution** de mon contrat. Ces envois ne sont pas du marketing et ne dépendent pas de cette case.  

**Politique** : lien vers la **politique de confidentialité** (page dédiée).

---

## Español (ES)

**Etiqueta del checkbox (marketing / lifecycle)**  

> Acepto recibir **comunicaciones personalizadas** de Alexandra (FitMangas): consejos de bienestar, novedades de clases, ofertas puntuales e inspiración para mi práctica. Puedo **darme de baja en cualquier momento** con el enlace de cada correo o desde mi área de cliente.  

**Texto informativo (obligatorio / transaccional)**  

> Aunque no marque esta casilla, recibiré los **correos necesarios** para el buen funcionamiento del servicio: confirmación de cuenta, seguridad (restablecimiento de contraseña), confirmaciones y recibos de **pago (Stripe)**, recordatorios relacionados con mis **reservas o suscripciones**, y mensajes vinculados a la **ejecución** de mi contrato. Estos envíos no son publicitarios y no dependen de esta casilla.  

**Enlace** a la **política de privacidad**.

---

## Notes implémentation (Phase ultérieure)

- Stocker `marketing_email_opt_in` + horodatage au consentement (voir migration proposée `proposed-migration-phase1-comms.sql`).  
- Prévoir mise à jour depuis `/compte/profil` ou page **préférences** (aligné roadmap).  
- Conserver la **preuve** d’opt-in (horodatage + version du texte légal affiché — option table `legal_consents` en phase ultérieure si le conseil l’exige).
