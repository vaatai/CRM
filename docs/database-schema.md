# CRM Database Schema

## Architecture Overview

This CRM uses a **multi-tenant architecture** where `Organization` is the tenant boundary. Every CRM entity (contacts, deals, leads, tasks, etc.) belongs to an organization, ensuring complete data isolation between tenants.

## ER Diagram (Mermaid)

```mermaid
erDiagram
    Organization ||--o{ OrganizationMember : "has members"
    Organization ||--o{ Role : "defines roles"
    Organization ||--o{ Contact : "owns"
    Organization ||--o{ Lead : "owns"
    Organization ||--o{ Company : "owns"
    Organization ||--o{ Deal : "owns"
    Organization ||--o{ Task : "owns"
    Organization ||--o{ Activity : "owns"
    Organization ||--o{ Note : "owns"
    Organization ||--o{ Tag : "owns"

    User ||--o{ OrganizationMember : "belongs to orgs"
    User ||--o{ Activity : "performs"
    User ||--o{ Note : "writes"

    OrganizationMember }o--|| Role : "has role"

    Role ||--o{ RolePermission : "grants"
    Permission ||--o{ RolePermission : "assigned via"

    Company ||--o{ Contact : "employs"
    Company ||--o{ Deal : "involved in"

    Contact ||--o{ Deal : "associated with"
    Contact ||--o{ Lead : "sourced from"
    Contact ||--o{ Activity : "involved in"
    Contact ||--o{ Note : "about"
    Contact ||--o{ Task : "related to"

    Deal ||--o{ Task : "has"
    Deal ||--o{ Activity : "tracked by"
    Deal ||--o{ Note : "about"

    Tag ||--o{ TagAssignment : "applied via"
    TagAssignment }o--o| Contact : "tags"
    TagAssignment }o--o| Company : "tags"
    TagAssignment }o--o| Deal : "tags"
    TagAssignment }o--o| Lead : "tags"
    TagAssignment }o--o| Task : "tags"

    Organization {
        string id PK
        string name
        string slug UK
        string logoUrl
        string website
    }

    User {
        string id PK
        string clerkId UK
        string email UK
        string firstName
        string lastName
        SystemRole systemRole
    }

    OrganizationMember {
        string id PK
        string userId FK
        string organizationId FK
        string roleId FK
    }

    Role {
        string id PK
        string name
        string organizationId FK
        boolean isDefault
    }

    Permission {
        string id PK
        string action
        string resource
    }

    RolePermission {
        string roleId FK
        string permissionId FK
    }

    Company {
        string id PK
        string organizationId FK
        string name
        string industry
        string website
    }

    Contact {
        string id PK
        string organizationId FK
        string ownerId FK
        string createdById FK
        string companyId FK
        string firstName
        string lastName
        string email
    }

    Lead {
        string id PK
        string organizationId FK
        string ownerId FK
        string contactId FK
        string title
        LeadStatus status
        LeadSource source
        decimal value
    }

    Deal {
        string id PK
        string organizationId FK
        string ownerId FK
        string createdById FK
        string contactId FK
        string companyId FK
        string title
        DealStage stage
        decimal value
        int probability
    }

    Task {
        string id PK
        string organizationId FK
        string assigneeId FK
        string createdById FK
        string dealId FK
        string contactId FK
        string title
        TaskStatus status
        TaskPriority priority
    }

    Activity {
        string id PK
        string organizationId FK
        string userId FK
        string contactId FK
        string dealId FK
        ActivityType type
        string title
        int duration
    }

    Note {
        string id PK
        string organizationId FK
        string userId FK
        string contactId FK
        string dealId FK
        string content
        boolean isPinned
    }

    Tag {
        string id PK
        string organizationId FK
        string name
        TagColor color
    }

    TagAssignment {
        string id PK
        string tagId FK
        string contactId FK
        string companyId FK
        string dealId FK
        string leadId FK
        string taskId FK
    }
```

## Models

### Core Tenancy

| Model                  | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| **Organization**       | Tenant boundary. All CRM data is scoped to an organization.    |
| **User**               | Authenticated via Clerk. Can belong to multiple organizations. |
| **OrganizationMember** | Join table: User ↔ Organization, with a Role.                  |

### RBAC

| Model              | Description                                              |
| ------------------ | -------------------------------------------------------- |
| **Role**           | Named role within an org (e.g., Admin, Manager, Member). |
| **Permission**     | Action + Resource pair (e.g., `create` + `contact`).     |
| **RolePermission** | Join table: Role ↔ Permission (many-to-many).            |

### CRM Entities

| Model             | Description                                                                      |
| ----------------- | -------------------------------------------------------------------------------- |
| **Company**       | Business entity. Has many contacts and deals.                                    |
| **Contact**       | Individual person. Belongs to org, optionally to a company. Has owner + creator. |
| **Lead**          | Sales opportunity in early stage. Can link to a contact.                         |
| **Deal**          | Sales pipeline item. Links to contact + company. Has stage, value, probability.  |
| **Task**          | Action item. Can belong to a deal and/or contact. Has assignee + creator.        |
| **Activity**      | Logged interaction (call, email, meeting, etc.). Links to contact + deal.        |
| **Note**          | Free-text annotation. Links to contact and/or deal. Can be pinned.               |
| **Tag**           | Label with color, scoped to org. Applied via TagAssignment (polymorphic).        |
| **TagAssignment** | Polymorphic join: Tag ↔ Contact/Company/Deal/Lead/Task.                          |

## Enums

| Enum           | Values                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `SystemRole`   | `SUPER_ADMIN`, `USER`                                                                          |
| `LeadStatus`   | `NEW`, `CONTACTED`, `QUALIFIED`, `UNQUALIFIED`, `CONVERTED`                                    |
| `LeadSource`   | `WEBSITE`, `REFERRAL`, `SOCIAL_MEDIA`, `EMAIL_CAMPAIGN`, `COLD_CALL`, `ADVERTISEMENT`, `OTHER` |
| `DealStage`    | `PROSPECTING`, `QUALIFICATION`, `PROPOSAL`, `NEGOTIATION`, `CLOSED_WON`, `CLOSED_LOST`         |
| `TaskStatus`   | `TODO`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`                                                |
| `TaskPriority` | `LOW`, `MEDIUM`, `HIGH`, `URGENT`                                                              |
| `ActivityType` | `CALL`, `EMAIL`, `MEETING`, `NOTE`, `TASK`, `OTHER`                                            |
| `TagColor`     | `GRAY`, `RED`, `ORANGE`, `YELLOW`, `GREEN`, `BLUE`, `PURPLE`, `PINK`                           |

## Key Relationships

```
Organization ─┬─ Members (User + Role)
              ├─ Companies ─── Contacts
              ├─ Contacts ──┬── Deals ──── Tasks
              │             ├── Leads
              │             ├── Activities
              │             └── Notes
              ├─ Deals ─────┬── Tasks
              │             ├── Activities
              │             └── Notes
              ├─ Tags ──────── TagAssignments → Contact | Company | Deal | Lead | Task
              └─ Roles ─────── Permissions
```

## Multi-Tenancy Pattern

Every query-able CRM model has an `organizationId` foreign key. This ensures:

1. **Data isolation**: Contacts in Org A are invisible to Org B
2. **Scoped indexes**: All indexes include `organizationId` for query performance
3. **Cascade deletes**: Deleting an org removes all its data
4. **User sharing**: A User can belong to multiple orgs via `OrganizationMember`

## Seed Data

Run `npm run db:seed` to populate the database with sample data:

- 1 organization (Acme Corp)
- 3 users (Admin, Manager, Member) with role assignments
- 3 roles with 28 permissions (7 resources × 4 CRUD actions)
- 3 companies, 4 contacts, 3 leads, 3 deals
- 4 tasks, 4 activities, 3 notes, 5 tags with 6 assignments
