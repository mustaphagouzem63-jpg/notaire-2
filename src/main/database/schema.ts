// ============================================================
// DATABASE SCHEMA — DDL, Indexes, FTS5, Seed Data
// ============================================================

import { getDatabase } from './connection'
import bcrypt from 'bcryptjs'

export function initializeDatabase(): void {
  const db = getDatabase()

  createTables()
  createIndexes()
  createFTSTables()
  createFTSTriggers()
  seedDefaultData()
}

// ── Table Definitions ─────────────────────────────────────────

function createTables(): void {
  const db = getDatabase()

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'clerk',
      theme_preference TEXT NOT NULL DEFAULT 'dark',
      language_preference TEXT NOT NULL DEFAULT 'fr',
      is_active INTEGER NOT NULL DEFAULT 1,
      force_password_change INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      full_name_ar TEXT,
      national_id TEXT NOT NULL UNIQUE,
      phone TEXT,
      address TEXT,
      address_ar TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_number TEXT NOT NULL UNIQUE,
      contract_type TEXT NOT NULL,
      client_a_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
      client_b_id INTEGER REFERENCES clients(id) ON DELETE RESTRICT,
      content_ar TEXT,
      content_fr TEXT,
      property_details TEXT,
      pdf_path TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      signed_date TEXT,
      notary_fees REAL NOT NULL DEFAULT 0,
      government_tax REAL NOT NULL DEFAULT 0,
      stamp_duty REAL NOT NULL DEFAULT 0,
      signature_image_path TEXT,
      stamp_image_path TEXT,
      document_hash TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      finalized_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contract_parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      document_category TEXT,
      ocr_text TEXT,
      mime_type TEXT,
      file_size INTEGER,
      version INTEGER NOT NULL DEFAULT 1,
      is_current INTEGER NOT NULL DEFAULT 1,
      parent_document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
      change_summary TEXT,
      uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      title_ar TEXT,
      appointment_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      status TEXT NOT NULL DEFAULT 'scheduled',
      location TEXT,
      notes TEXT,
      reminder_sent INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      username TEXT NOT NULL,
      action_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      description TEXT,
      session_id TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS office_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contract_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_type TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      name_fr TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      content_fr TEXT NOT NULL,
      content_ar TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

// ── Performance Indexes ───────────────────────────────────────

function createIndexes(): void {
  const db = getDatabase()

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_clients_national_id ON clients(national_id);
    CREATE INDEX IF NOT EXISTS idx_clients_full_name ON clients(full_name);
    CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
    CREATE INDEX IF NOT EXISTS idx_clients_is_deleted ON clients(is_deleted);

    CREATE INDEX IF NOT EXISTS idx_contracts_client_a ON contracts(client_a_id);
    CREATE INDEX IF NOT EXISTS idx_contracts_client_b ON contracts(client_b_id);
    CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
    CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(contract_type);
    CREATE INDEX IF NOT EXISTS idx_contracts_is_deleted ON contracts(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);

    CREATE INDEX IF NOT EXISTS idx_parties_contract ON contract_parties(contract_id);
    CREATE INDEX IF NOT EXISTS idx_parties_client ON contract_parties(client_id);

    CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
    CREATE INDEX IF NOT EXISTS idx_documents_contract ON documents(contract_id);
    CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(document_category);
    CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_document_id);

    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_contract ON appointments(contract_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type);

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

    CREATE INDEX IF NOT EXISTS idx_templates_type ON contract_templates(contract_type);
    CREATE INDEX IF NOT EXISTS idx_templates_active ON contract_templates(is_active);
  `)
}

// ── Full-Text Search Tables ───────────────────────────────────

function createFTSTables(): void {
  const db = getDatabase()

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS clients_fts USING fts5(
      full_name, full_name_ar, national_id, phone, address, address_ar,
      content='clients',
      content_rowid='id'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS contracts_fts USING fts5(
      contract_number, content_ar, content_fr, property_details,
      content='contracts',
      content_rowid='id'
    );
  `)
}

// ── FTS Sync Triggers ─────────────────────────────────────────

function createFTSTriggers(): void {
  const db = getDatabase()

  db.exec(`
    -- Clients: keep FTS index in sync
    CREATE TRIGGER IF NOT EXISTS clients_fts_ai AFTER INSERT ON clients BEGIN
      INSERT INTO clients_fts(rowid, full_name, full_name_ar, national_id, phone, address, address_ar)
      VALUES (new.id, new.full_name, new.full_name_ar, new.national_id, new.phone, new.address, new.address_ar);
    END;

    CREATE TRIGGER IF NOT EXISTS clients_fts_ad AFTER DELETE ON clients BEGIN
      INSERT INTO clients_fts(clients_fts, rowid, full_name, full_name_ar, national_id, phone, address, address_ar)
      VALUES ('delete', old.id, old.full_name, old.full_name_ar, old.national_id, old.phone, old.address, old.address_ar);
    END;

    CREATE TRIGGER IF NOT EXISTS clients_fts_au AFTER UPDATE ON clients BEGIN
      INSERT INTO clients_fts(clients_fts, rowid, full_name, full_name_ar, national_id, phone, address, address_ar)
      VALUES ('delete', old.id, old.full_name, old.full_name_ar, old.national_id, old.phone, old.address, old.address_ar);
      INSERT INTO clients_fts(rowid, full_name, full_name_ar, national_id, phone, address, address_ar)
      VALUES (new.id, new.full_name, new.full_name_ar, new.national_id, new.phone, new.address, new.address_ar);
    END;

    -- Contracts: keep FTS index in sync
    CREATE TRIGGER IF NOT EXISTS contracts_fts_ai AFTER INSERT ON contracts BEGIN
      INSERT INTO contracts_fts(rowid, contract_number, content_ar, content_fr, property_details)
      VALUES (new.id, new.contract_number, new.content_ar, new.content_fr, new.property_details);
    END;

    CREATE TRIGGER IF NOT EXISTS contracts_fts_ad AFTER DELETE ON contracts BEGIN
      INSERT INTO contracts_fts(contracts_fts, rowid, contract_number, content_ar, content_fr, property_details)
      VALUES ('delete', old.id, old.contract_number, old.content_ar, old.content_fr, old.property_details);
    END;

    CREATE TRIGGER IF NOT EXISTS contracts_fts_au AFTER UPDATE ON contracts BEGIN
      INSERT INTO contracts_fts(contracts_fts, rowid, contract_number, content_ar, content_fr, property_details)
      VALUES ('delete', old.id, old.contract_number, old.content_ar, old.content_fr, old.property_details);
      INSERT INTO contracts_fts(rowid, contract_number, content_ar, content_fr, property_details)
      VALUES (new.id, new.contract_number, new.content_ar, new.content_fr, new.property_details);
    END;
  `)
}

// ── Seed Data ─────────────────────────────────────────────────

function seedDefaultData(): void {
  const db = getDatabase()

  // ── Default admin user ────────────────────────────────────
  const adminExists = db.prepare(
    'SELECT COUNT(*) as count FROM users WHERE username = ?'
  ).get('admin') as { count: number }

  if (adminExists.count === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 10)
    db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, theme_preference, language_preference, is_active, force_password_change)
      VALUES (?, ?, ?, ?, ?, ?, 1, 1)
    `).run('admin', passwordHash, 'Administrateur', 'admin', 'dark', 'fr')
  }

  // ── Default office settings ───────────────────────────────
  const settings: [string, string][] = [
    ['office_name', 'Office Notarial'],
    ['office_name_ar', 'مكتب التوثيق'],
    ['office_address', ''],
    ['office_address_ar', ''],
    ['office_phone', ''],
    ['notary_name', ''],
    ['notary_name_ar', ''],
    ['app_version', '1.0.0']
  ]

  const settingStmt = db.prepare(
    'INSERT OR IGNORE INTO office_settings (key, value) VALUES (?, ?)'
  )
  for (const [key, value] of settings) {
    settingStmt.run(key, value)
  }

  // ── Contract templates ────────────────────────────────────
  const templateExists = db.prepare(
    'SELECT COUNT(*) as count FROM contract_templates'
  ).get() as { count: number }

  if (templateExists.count === 0) {
    seedContractTemplates()
  }
}

function seedContractTemplates(): void {
  const db = getDatabase()

  const insertTemplate = db.prepare(`
    INSERT INTO contract_templates (contract_type, name_fr, name_ar, content_fr, content_ar)
    VALUES (?, ?, ?, ?, ?)
  `)

  // ── 1. Sale of Property ─────────────────────────────────
  insertTemplate.run(
    'sale',
    'Contrat de Vente Immobilière',
    'عقد بيع عقار',
    `CONTRAT DE VENTE IMMOBILIÈRE
N° {{contract_number}}

Rédigé le : {{date}}
À l'Office Notarial : {{office_name}}

ENTRE LES SOUSSIGNÉS :

PREMIÈRE PARTIE (Le Vendeur) :
Nom complet : {{client_a_name}}
Numéro d'identité nationale : {{client_a_national_id}}
Adresse : {{client_a_address}}

DEUXIÈME PARTIE (L'Acheteur) :
Nom complet : {{client_b_name}}
Numéro d'identité nationale : {{client_b_national_id}}
Adresse : {{client_b_address}}

IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :

ARTICLE PREMIER – Objet du contrat
Le Vendeur vend à l'Acheteur, qui accepte, le bien immobilier désigné ci-après :
{{property_details}}

ARTICLE 2 – Prix de la vente
La présente vente est consentie et acceptée moyennant le prix de : {{notary_fees}} DA
que l'Acheteur s'oblige à payer au Vendeur.

ARTICLE 3 – Déclarations du Vendeur
Le Vendeur déclare que le bien vendu est libre de toute hypothèque, saisie, servitude ou tout autre droit réel. Il garantit à l'Acheteur la jouissance paisible du bien.

ARTICLE 4 – Prise de possession
L'Acheteur prendra possession du bien à compter de la date de signature du présent acte.

ARTICLE 5 – Frais
Tous les frais, droits et honoraires relatifs au présent contrat sont à la charge de l'Acheteur, soit :
- Honoraires du notaire : {{notary_fees}} DA
- Droits d'enregistrement : {{government_tax}} DA
- Droit de timbre : {{stamp_duty}} DA

ARTICLE 6 – Élection de domicile
Pour l'exécution des présentes, les parties élisent domicile en leurs adresses respectives indiquées ci-dessus.

Fait en deux (02) exemplaires originaux à {{office_address}}, le {{date}}.

Signatures :

Le Vendeur                    L'Acheteur
_______________              _______________

Le Notaire : {{notary_name}}
_______________`,

    `بسم الله الرحمن الرحيم

عقد بيع عقار
رقم: {{contract_number}}

حُرِّر في: {{date}}
بمكتب التوثيق: {{office_name_ar}}

بين الموقعين أدناه:

الطرف الأول (البائع):
الاسم الكامل: {{client_a_name_ar}}
رقم الهوية الوطنية: {{client_a_national_id}}
العنوان: {{client_a_address_ar}}

الطرف الثاني (المشتري):
الاسم الكامل: {{client_b_name_ar}}
رقم الهوية الوطنية: {{client_b_national_id}}
العنوان: {{client_b_address_ar}}

تم الاتفاق والتراضي بين الطرفين على ما يلي:

المادة الأولى – موضوع العقد
باع الطرف الأول للطرف الثاني، الذي قبل ذلك، العقار المبيَّن أدناه:
{{property_details_ar}}

المادة الثانية – ثمن البيع
تم الاتفاق على ثمن البيع بمبلغ وقدره: {{notary_fees}} دج
يلتزم المشتري بدفعه للبائع.

المادة الثالثة – تصريحات البائع
يصرح البائع بأن العقار المبيع خالٍ من أي رهن أو حجز أو ارتفاق أو أي حق عيني آخر، ويضمن للمشتري التمتع الهادئ بالعقار.

المادة الرابعة – التسليم
يتسلم المشتري العقار ابتداءً من تاريخ التوقيع على هذا العقد.

المادة الخامسة – المصاريف
جميع مصاريف وحقوق ورسوم هذا العقد على عاتق المشتري، وهي:
- أتعاب الموثق: {{notary_fees}} دج
- رسوم التسجيل: {{government_tax}} دج
- حق الطابع: {{stamp_duty}} دج

المادة السادسة – الموطن المختار
لتنفيذ هذا العقد، يختار كل طرف موطنه المذكور أعلاه.

حُرِّر من نسختين (02) أصليتين بـ {{office_address_ar}}، بتاريخ {{date}}.

التوقيعات:

البائع                    المشتري
_______________              _______________

الموثق: {{notary_name_ar}}
_______________`
  )

  // ── 2. Power of Attorney ────────────────────────────────
  insertTemplate.run(
    'power_of_attorney',
    'Procuration',
    'توكيل',
    `PROCURATION
N° {{contract_number}}

Rédigé le : {{date}}
À l'Office Notarial : {{office_name}}

COMPARANT :

Le Mandant :
Nom complet : {{client_a_name}}
Numéro d'identité nationale : {{client_a_national_id}}
Adresse : {{client_a_address}}

Lequel, par les présentes, constitue pour son mandataire :

Le Mandataire :
Nom complet : {{client_b_name}}
Numéro d'identité nationale : {{client_b_national_id}}
Adresse : {{client_b_address}}

OBJET DE LA PROCURATION :
{{property_details}}

ÉTENDUE DES POUVOIRS :
Le Mandataire est autorisé à :
- Représenter le Mandant devant toutes les administrations publiques et privées
- Signer tous les documents nécessaires à l'exécution du mandat
- Accomplir toutes les formalités administratives requises
- Recevoir et donner quittance de toutes sommes

DURÉE :
La présente procuration est valable pour une durée d'un (01) an à compter de sa date de signature, sauf révocation expresse du Mandant.

ARTICLE FINAL :
Le Mandant déclare avoir donné au Mandataire tous les pouvoirs nécessaires pour mener à bien la mission qui lui est confiée.

Frais :
- Honoraires du notaire : {{notary_fees}} DA
- Droits d'enregistrement : {{government_tax}} DA
- Droit de timbre : {{stamp_duty}} DA

Fait à {{office_address}}, le {{date}}.

Le Mandant                    Le Mandataire
_______________              _______________

Le Notaire : {{notary_name}}
_______________`,

    `بسم الله الرحمن الرحيم

توكيل
رقم: {{contract_number}}

حُرِّر في: {{date}}
بمكتب التوثيق: {{office_name_ar}}

الحاضر:

الموكِّل:
الاسم الكامل: {{client_a_name_ar}}
رقم الهوية الوطنية: {{client_a_national_id}}
العنوان: {{client_a_address_ar}}

والذي بموجب هذا التوكيل يُعيِّن وكيلاً عنه:

الوكيل:
الاسم الكامل: {{client_b_name_ar}}
رقم الهوية الوطنية: {{client_b_national_id}}
العنوان: {{client_b_address_ar}}

موضوع التوكيل:
{{property_details_ar}}

نطاق الصلاحيات:
يُخوَّل الوكيل القيام بما يلي:
- تمثيل الموكِّل أمام جميع الإدارات العمومية والخاصة
- التوقيع على جميع الوثائق اللازمة لتنفيذ الوكالة
- إتمام جميع الإجراءات الإدارية المطلوبة
- استلام وإعطاء إيصالات لجميع المبالغ

المدة:
هذا التوكيل صالح لمدة سنة (01) واحدة ابتداءً من تاريخ التوقيع عليه، ما لم يتم إلغاؤه صراحةً من طرف الموكِّل.

المادة الأخيرة:
يصرح الموكِّل بأنه منح الوكيل جميع الصلاحيات اللازمة لإنجاز المهمة الموكلة إليه.

المصاريف:
- أتعاب الموثق: {{notary_fees}} دج
- رسوم التسجيل: {{government_tax}} دج
- حق الطابع: {{stamp_duty}} دج

حُرِّر بـ {{office_address_ar}}، بتاريخ {{date}}.

الموكِّل                    الوكيل
_______________              _______________

الموثق: {{notary_name_ar}}
_______________`
  )

  // ── 3. Company Agreement ────────────────────────────────
  insertTemplate.run(
    'company_agreement',
    'Contrat de Société',
    'عقد تأسيس شركة',
    `CONTRAT DE CONSTITUTION DE SOCIÉTÉ
N° {{contract_number}}

Rédigé le : {{date}}
À l'Office Notarial : {{office_name}}

ENTRE LES ASSOCIÉS :

Premier Associé :
Nom complet : {{client_a_name}}
Numéro d'identité nationale : {{client_a_national_id}}
Adresse : {{client_a_address}}

Deuxième Associé :
Nom complet : {{client_b_name}}
Numéro d'identité nationale : {{client_b_national_id}}
Adresse : {{client_b_address}}

IL A ÉTÉ ÉTABLI LES STATUTS SUIVANTS :

ARTICLE 1 – Forme juridique
Il est constitué entre les soussignés une société à responsabilité limitée (SARL) régie par les lois en vigueur.

ARTICLE 2 – Objet social
La société a pour objet :
{{property_details}}

ARTICLE 3 – Dénomination sociale
La société prend la dénomination : [À compléter]

ARTICLE 4 – Siège social
Le siège social est fixé à : {{office_address}}

ARTICLE 5 – Capital social
Le capital social est fixé à la somme de : {{notary_fees}} DA, divisé en parts sociales égales.

ARTICLE 6 – Durée
La durée de la société est fixée à quatre-vingt-dix-neuf (99) ans à compter de la date d'immatriculation au registre du commerce.

ARTICLE 7 – Gérance
La société est gérée par {{client_a_name}} en qualité de gérant, nommé pour une durée illimitée.

ARTICLE 8 – Exercice social
L'exercice social commence le 1er janvier et se termine le 31 décembre de chaque année.

Frais :
- Honoraires du notaire : {{notary_fees}} DA
- Droits d'enregistrement : {{government_tax}} DA
- Droit de timbre : {{stamp_duty}} DA

Fait à {{office_address}}, le {{date}}.

Premier Associé              Deuxième Associé
_______________              _______________

Le Notaire : {{notary_name}}
_______________`,

    `بسم الله الرحمن الرحيم

عقد تأسيس شركة
رقم: {{contract_number}}

حُرِّر في: {{date}}
بمكتب التوثيق: {{office_name_ar}}

بين الشركاء:

الشريك الأول:
الاسم الكامل: {{client_a_name_ar}}
رقم الهوية الوطنية: {{client_a_national_id}}
العنوان: {{client_a_address_ar}}

الشريك الثاني:
الاسم الكامل: {{client_b_name_ar}}
رقم الهوية الوطنية: {{client_b_national_id}}
العنوان: {{client_b_address_ar}}

تم وضع القانون الأساسي التالي:

المادة الأولى – الشكل القانوني
تؤسس بين الموقعين أدناه شركة ذات مسؤولية محدودة طبقاً للقوانين المعمول بها.

المادة الثانية – موضوع الشركة
موضوع الشركة هو:
{{property_details_ar}}

المادة الثالثة – التسمية التجارية
تحمل الشركة تسمية: [يُستكمل لاحقاً]

المادة الرابعة – المقر الاجتماعي
يقع المقر الاجتماعي للشركة بـ: {{office_address_ar}}

المادة الخامسة – رأس المال
حُدِّد رأس مال الشركة بمبلغ: {{notary_fees}} دج، مقسم إلى حصص اجتماعية متساوية.

المادة السادسة – المدة
حُدِّدت مدة الشركة بتسع وتسعين (99) سنة ابتداءً من تاريخ القيد في السجل التجاري.

المادة السابعة – التسيير
يتولى تسيير الشركة {{client_a_name_ar}} بصفته مديراً، معيَّناً لمدة غير محددة.

المادة الثامنة – السنة المالية
تبدأ السنة المالية في 1 جانفي وتنتهي في 31 ديسمبر من كل سنة.

المصاريف:
- أتعاب الموثق: {{notary_fees}} دج
- رسوم التسجيل: {{government_tax}} دج
- حق الطابع: {{stamp_duty}} دج

حُرِّر بـ {{office_address_ar}}، بتاريخ {{date}}.

الشريك الأول              الشريك الثاني
_______________              _______________

الموثق: {{notary_name_ar}}
_______________`
  )

  // ── 4. Donation ─────────────────────────────────────────
  insertTemplate.run(
    'donation',
    'Acte de Donation',
    'عقد هبة',
    `ACTE DE DONATION
N° {{contract_number}}

Rédigé le : {{date}}
À l'Office Notarial : {{office_name}}

ENTRE :

Le Donateur :
Nom complet : {{client_a_name}}
Numéro d'identité nationale : {{client_a_national_id}}
Adresse : {{client_a_address}}

Le Donataire :
Nom complet : {{client_b_name}}
Numéro d'identité nationale : {{client_b_national_id}}
Adresse : {{client_b_address}}

IL A ÉTÉ EXPOSÉ ET CONVENU CE QUI SUIT :

ARTICLE 1 – Objet de la donation
Le Donateur fait donation irrévocable, en pleine propriété, au Donataire qui accepte, du bien suivant :
{{property_details}}

ARTICLE 2 – Déclarations du Donateur
Le Donateur déclare :
- Être le propriétaire légitime et exclusif du bien donné
- Que le bien est libre de toute hypothèque, servitude ou charge
- Que cette donation est faite de son plein gré, sans contrainte

ARTICLE 3 – Acceptation
Le Donataire déclare accepter la présente donation et en remercie le Donateur.

ARTICLE 4 – Jouissance
Le Donataire jouira du bien donné à compter de ce jour.

ARTICLE 5 – Frais
Tous les frais du présent acte sont à la charge du Donataire :
- Honoraires du notaire : {{notary_fees}} DA
- Droits d'enregistrement : {{government_tax}} DA
- Droit de timbre : {{stamp_duty}} DA

Fait à {{office_address}}, le {{date}}.

Le Donateur                  Le Donataire
_______________              _______________

Le Notaire : {{notary_name}}
_______________`,

    `بسم الله الرحمن الرحيم

عقد هبة
رقم: {{contract_number}}

حُرِّر في: {{date}}
بمكتب التوثيق: {{office_name_ar}}

بين:

الواهب:
الاسم الكامل: {{client_a_name_ar}}
رقم الهوية الوطنية: {{client_a_national_id}}
العنوان: {{client_a_address_ar}}

الموهوب له:
الاسم الكامل: {{client_b_name_ar}}
رقم الهوية الوطنية: {{client_b_national_id}}
العنوان: {{client_b_address_ar}}

تم الاتفاق على ما يلي:

المادة الأولى – موضوع الهبة
يهب الواهب هبة نهائية غير قابلة للرجوع، ملكية تامة، للموهوب له الذي قبلها، ما يلي:
{{property_details_ar}}

المادة الثانية – تصريحات الواهب
يصرح الواهب بما يلي:
- أنه المالك الشرعي والوحيد للشيء الموهوب
- أن الشيء الموهوب خالٍ من أي رهن أو ارتفاق أو أعباء
- أن هذه الهبة تمت بإرادته الحرة دون إكراه

المادة الثالثة – القبول
يصرح الموهوب له بقبول هذه الهبة ويشكر الواهب عليها.

المادة الرابعة – الانتفاع
يتمتع الموهوب له بالشيء الموهوب ابتداءً من هذا اليوم.

المادة الخامسة – المصاريف
جميع مصاريف هذا العقد على عاتق الموهوب له:
- أتعاب الموثق: {{notary_fees}} دج
- رسوم التسجيل: {{government_tax}} دج
- حق الطابع: {{stamp_duty}} دج

حُرِّر بـ {{office_address_ar}}، بتاريخ {{date}}.

الواهب                    الموهوب له
_______________              _______________

الموثق: {{notary_name_ar}}
_______________`
  )
}
