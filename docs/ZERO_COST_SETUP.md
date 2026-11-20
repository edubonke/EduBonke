# EduBonke R0 Setup Guide

This guide creates the functional prototype without ChatGPT hosting or a paid hosting plan. GitHub Pages hosts the public synthetic demo. The optional connected setup below is for a separate deployment or local development.

## Fastest demonstration: GitHub Pages only

The interactive dummy-data demo does not need Supabase. After GitHub Pages deploys, open:

```text
https://edubonke.github.io/EduBonke/demo/
```

Choose **Student demo** to preview a learner's personal workspace, or **Staff and admin demo** to switch between six college staff access levels. The invented records run entirely in the current browser tab. Demonstration changes are not shared across devices and disappear after a refresh or **Reset demo**. Continue with the Supabase steps below only when you want to test real authentication, tenant isolation and shared synthetic records.

## 1. Create the optional Supabase project

1. Open `https://supabase.com/dashboard` and create a free account.
2. Select **New project**.
3. Give the project a clear test name such as `edubonke-prototype`.
4. Generate and securely store the database password. Do not put it in GitHub.
5. Choose the closest appropriate available region after considering South African data-transfer and POPIA requirements.
6. Wait for project provisioning to finish.

Free projects can pause after low activity. This is acceptable for a synthetic prototype but not for a live customer.

## 2. Create the database and security policies

1. In Supabase, open **SQL Editor**.
2. Select **New query**.
3. Copy the complete contents of `supabase/migrations/202608150001_edubonke_full.sql` from this repository.
4. Paste it into SQL Editor and select **Run**.
5. Confirm that the query completes without an error.
6. Create another new query and run `supabase/migrations/202608210002_qr_attendance.sql`.
7. Confirm that the QR-attendance migration also completes without an error.

The migrations create the application tables, tenant-isolation functions, role policies, audit triggers, private document bucket, synthetic-data function and authenticated QR check-in. Students must be signed in, linked to a student record and actively enrolled in the register's class before a QR check-in can be written.

## 3. Configure authentication URLs

In Supabase, open **Authentication → URL Configuration**.

Set the Site URL and allowed redirect URLs to the actual origin and path of your separate connected portal. For local development use `http://localhost:3000` and `http://localhost:3000/**`.

## 4. Configure the separate connected environment

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the separate deployment's build environment or a local `.env.local`. Use only the project URL and browser publishable key. Keep service-role credentials out of frontend builds. The public Pages workflow does not use backend credentials.

## 5. Enable GitHub Pages

1. Open **Settings → Pages** in the repository.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Open the **Actions** tab.
4. Run **Deploy EduBonke to GitHub Pages**, or push a commit to `main`.
5. Wait for the build and deployment jobs to become green.

The resulting address is:

```text
https://edubonke.github.io/EduBonke/
```

## 6. Create the first workspace

1. Open `/login/` on the separately configured connected deployment.
2. Create an account using an email address you control.
3. Confirm the address using the Supabase email.
4. Sign in and select **Create a test college**.
5. Open **Administration** and select **Load synthetic demo data**.

The demonstration records are clearly labelled `TEST` and use `.invalid` email domains.

## 7. Test shared access

1. As College Administrator, create an invite under **Administration**.
2. Use a second approved email address to create another EduBonke account.
3. Enter the single-use invite code.
4. Confirm that the second account sees only its authorised college and role-based actions.
5. Test from a second browser or device to confirm shared information.

## R0 limitations

- GitHub Pages is public static hosting; protected data remains in Supabase.
- Supabase may pause an inactive free project.
- Free-tier availability, quotas and terms can change.
- Automated production backups, restore drills, malware scanning, central monitoring and guaranteed uptime are not included.
- Use synthetic information only.

Before introducing live learners, complete every item in `docs/PRODUCTION_READINESS.md`.
