● Here's the current role-based access breakdown:

  Role Hierarchy
  ┌─────────────┬──────────────────┐
  │    Role     │      Level       │
  ├─────────────┼──────────────────┤
  │ EDITOR      │ Default (lowest) │
  ├─────────────┼──────────────────┤
  │ ADMIN       │ Middle           │
  ├─────────────┼──────────────────┤
  │ SUPER_ADMIN │ Highest          │
  └─────────────┴──────────────────┘
  ---
  Feature Access Matrix
  ┌─────────────────────────────┬────────┬───────┬─────────────┐
  │           Feature           │ EDITOR │ ADMIN │ SUPER_ADMIN │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Dashboard                   │   ✓    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Events Management           │   ✓    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Submissions (view)          │   ✓    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Submissions (delete)        │   ✗    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Calendar                    │   ✓    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Tasks                       │   ✓    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Contacts                    │   ✓    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Notes                       │   ✓    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Analytics                   │   ✓    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Users Management            │   ✗    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Create EDITOR users         │   ✗    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Create ADMIN/SUPER_ADMIN    │   ✗    │   ✗   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Modify ADMIN users          │   ✗    │   ✗   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Approve User Accounts       │   ✗    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Settings (General/Homepage) │   ✗    │   ✓   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Settings (Security)         │   ✗    │   ✗   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Settings (Email/Gmail)      │   ✗    │   ✗   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Legacy User Migration       │   ✗    │   ✗   │      ✓      │
  ├─────────────────────────────┼────────┼───────┼─────────────┤
  │ Own Profile Edit            │   ✓    │   ✓   │      ✓      │
  └─────────────────────────────┴────────┴───────┴─────────────┘
  ---
  Sidebar Navigation Visibility

  All Users: Dashboard, Events, Submissions, Calendar, Tasks, Contacts, Notes, Analytics

  ADMIN & SUPER_ADMIN Only: Users, Settings

  ---
  Key Restrictions

  - EDITOR: Cannot access Users or Settings pages at all
  - ADMIN: Can manage EDITOR users only; cannot touch ADMIN/SUPER_ADMIN accounts or email configuration
  - SUPER_ADMIN: Full unrestricted access to everything