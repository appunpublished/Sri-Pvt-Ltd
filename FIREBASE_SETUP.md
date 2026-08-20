# Firebase Setup Checklist

Project: `sripvtltd`

## 1. Enable Email/Password

Firebase Console → Authentication → Sign-in method → Email/Password → Enable.

## 2. Create the administrator

Firebase Console → Authentication → Users → Add user.

Create the email/password account you want to use for `/admin/`.

Copy the user's **UID**.

## 3. Authorise the administrator in Firestore

Firebase Console → Firestore Database → Data.

Create this document:

```text
Collection: admins
Document ID: <EXACT_AUTHENTICATION_UID>

active: true
role: "admin"
```

Example:

```text
admins
└── abc123XYZ
    ├── active: true
    └── role: admin
```

The document ID must be the exact UID shown under Authentication → Users.

## 4. Deploy Firestore rules

Use the included `firestore.rules`.

If you have not deployed the rules yet, the admin login can authenticate successfully but the Firestore admin check will fail.

## 5. Test locally

Run the project through an HTTP server, for example:

```text
http://localhost:8000/admin/
```

Do not open `admin/index.html` directly using `file://`.

## 6. Login troubleshooting

The updated login screen now reports the specific Firebase failure.

- `Incorrect email or password` → check Authentication → Users.
- `Email/Password authentication is not enabled` → enable the provider.
- `admins/<UID> does not exist` → create the Firestore document.
- `admins/<UID> is not active` → set `active` to boolean `true`.
- `Firestore denied access` → deploy the included rules.
- `Firestore is not configured` → create Firestore Database.

## Security

Never put a Firebase Admin SDK service-account JSON, Cloudinary API Secret, payment gateway secret, or other server-side credential in this repository.
