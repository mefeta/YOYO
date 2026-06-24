import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'yoyo.db');
// Run migration first to ensure tables exist
const { execSync } = await import('child_process');
execSync(`tsx ${path.join(__dirname, 'migrate.ts')}`, { stdio: 'inherit' });
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
const now = new Date();
const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();
const minutesAgo = (m) => new Date(now.getTime() - m * 60000).toISOString();
// Clear existing data
const tables = ['ai_model_runs', 'audit_logs', 'integrations', 'reports', 'automation_executions', 'automation_rules', 'assignment_recommendations', 'request_events', 'requests', 'agents', 'teams', 'customers', 'organizations', 'users'];
for (const t of tables)
    sqlite.exec(`DELETE FROM ${t}`);
// === USERS ===
const users = [
    { id: uuid(), name: 'Ahmet Yılmaz', email: 'admin@yoyo.ai', role: 'admin', avatar: null },
    { id: uuid(), name: 'Elif Kaya', email: 'manager@yoyo.ai', role: 'manager', avatar: null },
    { id: uuid(), name: 'Zeynep Demir', email: 'agent@yoyo.ai', role: 'agent', avatar: null },
    { id: uuid(), name: 'Mehmet Can', email: 'analyst@yoyo.ai', role: 'analyst', avatar: null },
    { id: uuid(), name: 'Ayşe Şahin', email: 'viewer@yoyo.ai', role: 'viewer', avatar: null },
    { id: uuid(), name: 'Ali Öztürk', email: 'ali@yoyo.ai', role: 'agent', avatar: null },
    { id: uuid(), name: 'Fatma Yıldız', email: 'fatma@yoyo.ai', role: 'agent', avatar: null },
    { id: uuid(), name: 'Caner Aydın', email: 'caner@yoyo.ai', role: 'agent', avatar: null },
    { id: uuid(), name: 'Derya Arslan', email: 'derya@yoyo.ai', role: 'agent', avatar: null },
    { id: uuid(), name: 'Burak Çelik', email: 'burak@yoyo.ai', role: 'agent', avatar: null },
    { id: uuid(), name: 'Selin Tekin', email: 'selin@yoyo.ai', role: 'agent', avatar: null },
    { id: uuid(), name: 'Ozan Korkmaz', email: 'ozan@yoyo.ai', role: 'agent', avatar: null },
    { id: uuid(), name: 'İrem Yalçın', email: 'irem@yoyo.ai', role: 'agent', avatar: null },
    { id: uuid(), name: 'Emre Güneş', email: 'emre@yoyo.ai', role: 'agent', avatar: null },
    { id: uuid(), name: 'Cemre Polat', email: 'cemre@yoyo.ai', role: 'agent', avatar: null },
];
const insertUser = sqlite.prepare('INSERT INTO users (id, name, email, password_hash, role, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
const hashPassword = (email) => bcrypt.hashSync(email.split('@')[0], 10);
for (const u of users) {
    insertUser.run(u.id, u.name, u.email, hashPassword(u.email), u.role, u.avatar, daysAgo(60));
}
// === ORGANIZATION ===
const orgId = uuid();
sqlite.prepare('INSERT INTO organizations (id, name, sector, subscription_plan, created_at) VALUES (?, ?, ?, ?, ?)').run(orgId, 'YOYO Demo Corp', 'Technology', 'enterprise', daysAgo(120));
// === TEAMS ===
const teams = [
    { id: uuid(), name: 'Lojistik Operasyon', description: 'Lojistik ve kargo talepleri', sector: 'Logistics', level: 1 },
    { id: uuid(), name: 'Telekom Destek', description: 'Telekomünikasyon hizmet talepleri', sector: 'Telecom', level: 1 },
    { id: uuid(), name: 'Pazarlama Ekibi', description: 'Pazarlama kampanya ve onay süreçleri', sector: 'Marketing', level: 1 },
    { id: uuid(), name: 'Finans Operasyon', description: 'Fatura, ödeme ve muhasebe talepleri', sector: 'Finance', level: 2 },
    { id: uuid(), name: 'Perakende Destek', description: 'Perakende mağaza ve müşteri desteği', sector: 'Retail', level: 1 },
    { id: uuid(), name: 'Sağlık Operasyon', description: 'Sağlık operasyon ve hasta hizmetleri', sector: 'Healthcare', level: 2 },
];
const insertTeam = sqlite.prepare('INSERT INTO teams (id, name, description, sector_focus, escalation_level, created_at) VALUES (?, ?, ?, ?, ?, ?)');
for (const t of teams)
    insertTeam.run(t.id, t.name, t.description, t.sector, t.level, daysAgo(90));
// === AGENTS ===
const agentConfigs = [
    { userId: users[2].id, teamId: teams[0].id, role: 'Kıdemli Operasyon Uzmanı', skills: '["Lojistik Yönetimi","Kargo Takip","Müşteri İletişimi","SAP","Excel"]', sectors: '["Logistics","Retail"]', langs: '["Turkish","English"]', status: 'available', cap: 12, load: 3, avgTime: 2.1, satisfaction: 4.8 },
    { userId: users[5].id, teamId: teams[0].id, role: 'Operasyon Uzmanı', skills: '["Kargo Takip","Teslimat Yönetimi","Müşteri Hizmetleri"]', sectors: '["Logistics"]', langs: '["Turkish"]', status: 'available', cap: 10, load: 5, avgTime: 3.2, satisfaction: 4.2 },
    { userId: users[6].id, teamId: teams[1].id, role: 'Teknik Destek Mühendisi', skills: '["Ağ Yönetimi","Saha Kurulumu","Arıza Tespit","Fiber Teknolojileri"]', sectors: '["Telecom"]', langs: '["Turkish","English"]', status: 'busy', cap: 8, load: 7, avgTime: 4.5, satisfaction: 3.9 },
    { userId: users[7].id, teamId: teams[1].id, role: 'Telekom Uzmanı', skills: '["Müşteri Destek","Fatura Yönetimi","Santral Yapılandırma","VoIP"]', sectors: '["Telecom","Finance"]', langs: '["Turkish","English"]', status: 'available', cap: 10, load: 4, avgTime: 2.8, satisfaction: 4.5 },
    { userId: users[8].id, teamId: teams[2].id, role: 'Pazarlama Koordinatörü', skills: '["Kampanya Yönetimi","Sosyal Medya","İçerik Üretimi","SEO","Google Ads"]', sectors: '["Marketing","Retail"]', langs: '["Turkish","English"]', status: 'available', cap: 10, load: 6, avgTime: 3.0, satisfaction: 4.6 },
    { userId: users[9].id, teamId: teams[2].id, role: 'Kreatif Tasarımcı', skills: '["Grafik Tasarım","Video Prodüksiyon","Adobe Creative Suite","Marka Yönetimi"]', sectors: '["Marketing"]', langs: '["Turkish"]', status: 'available', cap: 8, load: 4, avgTime: 5.2, satisfaction: 4.3 },
    { userId: users[10].id, teamId: teams[3].id, role: 'Finans Analisti', skills: '["Muhasebe","Fatura Yönetimi","Vergi Hukuku","ERP","Risk Analizi"]', sectors: '["Finance"]', langs: '["Turkish","English"]', status: 'available', cap: 10, load: 5, avgTime: 3.5, satisfaction: 4.7 },
    { userId: users[11].id, teamId: teams[3].id, role: 'Muhasebe Uzmanı', skills: '["Ödeme İşleme","Banka Mutabakatı","Gider Yönetimi","Excel"]', sectors: '["Finance"]', langs: '["Turkish"]', status: 'away', cap: 10, load: 8, avgTime: 4.0, satisfaction: 4.0 },
    { userId: users[12].id, teamId: teams[4].id, role: 'Perakende Destek Uzmanı', skills: '["Mağaza Operasyon","İade Yönetimi","Stok Takip","Müşteri İlişkileri"]', sectors: '["Retail","Logistics"]', langs: '["Turkish","English"]', status: 'available', cap: 10, load: 3, avgTime: 2.5, satisfaction: 4.4 },
    { userId: users[13].id, teamId: teams[5].id, role: 'Sağlık Operasyon Uzmanı', skills: '["Hasta Kayıt","Randevu Yönetimi","Medikal Dokümantasyon","Hasta İletişimi"]', sectors: '["Healthcare"]', langs: '["Turkish","English"]', status: 'available', cap: 10, load: 2, avgTime: 3.8, satisfaction: 4.9 },
    { userId: users[14].id, teamId: teams[0].id, role: 'Lojistik Koordinatör', skills: '["Filo Yönetimi","Rota Optimizasyonu","Kargo Takip","Müşteri İletişimi","Lojistik Yazılımları"]', sectors: '["Logistics","Retail"]', langs: '["Turkish","English"]', status: 'available', cap: 10, load: 6, avgTime: 2.7, satisfaction: 4.6 },
];
const insertAgent = sqlite.prepare('INSERT INTO agents (id, user_id, team_id, role_title, skills, sectors, languages, availability_status, capacity, current_workload, avg_resolution_time, satisfaction_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const agents = [];
for (const a of agentConfigs) {
    const id = uuid();
    agents.push({ id, userId: a.userId, teamId: a.teamId });
    insertAgent.run(id, a.userId, a.teamId, a.role, a.skills, a.sectors, a.langs, a.status, a.cap, a.load, a.avgTime, a.satisfaction, daysAgo(80));
}
// === CUSTOMERS ===
const customerData = [
    { name: 'Mustafa Yıldırım', company: 'Aras Lojistik', tier: 'enterprise', sector: 'Logistics' },
    { name: 'Ayşe Karahan', company: 'Trendyol Express', tier: 'enterprise', sector: 'Logistics' },
    { name: 'Mehmet Demirtaş', company: 'Turkcell', tier: 'enterprise', sector: 'Telecom' },
    { name: 'Zeynep Aksoy', company: 'Vodafone TR', tier: 'premium', sector: 'Telecom' },
    { name: 'Ali Şen', company: 'Doğuş Yayın Grubu', tier: 'enterprise', sector: 'Marketing' },
    { name: 'Elif Yılmazer', company: 'Publicis Türkiye', tier: 'premium', sector: 'Marketing' },
    { name: 'Burak Korkmaz', company: 'Garanti BBVA', tier: 'enterprise', sector: 'Finance' },
    { name: 'Cemre Yalçın', company: 'Akbank', tier: 'enterprise', sector: 'Finance' },
    { name: 'Derya Özkan', company: 'Migros', tier: 'enterprise', sector: 'Retail' },
    { name: 'Fatih Polat', company: 'LC Waikiki', tier: 'premium', sector: 'Retail' },
    { name: 'Gülşah Aydın', company: 'Acıbadem Sağlık', tier: 'enterprise', sector: 'Healthcare' },
    { name: 'Hakan Güneş', company: 'Medicana', tier: 'premium', sector: 'Healthcare' },
    { name: 'İrem Koç', company: 'Ekol Lojistik', tier: 'premium', sector: 'Logistics' },
    { name: 'Kaan Aslan', company: 'Türk Telekom', tier: 'enterprise', sector: 'Telecom' },
    { name: 'Lale Çetin', company: 'MediaCat', tier: 'basic', sector: 'Marketing' },
    { name: 'Murat Ersoy', company: 'QNB Finansbank', tier: 'premium', sector: 'Finance' },
    { name: 'Nazlı Şimşek', company: 'Boyner', tier: 'basic', sector: 'Retail' },
    { name: 'Onur Yıldız', company: 'Beyaz Hastane', tier: 'basic', sector: 'Healthcare' },
    { name: 'Pınar Ateş', company: 'MNG Kargo', tier: 'premium', sector: 'Logistics' },
    { name: 'Rıza Can', company: 'Turknet', tier: 'basic', sector: 'Telecom' },
    { name: 'Sema Karataş', company: 'ReklamZ', tier: 'basic', sector: 'Marketing' },
    { name: 'Tolga Başar', company: 'Halkbank', tier: 'premium', sector: 'Finance' },
    { name: 'Ümit Özgür', company: 'CarrefourSA', tier: 'basic', sector: 'Retail' },
    { name: 'Volkan Eker', company: 'Medipol Sağlık', tier: 'premium', sector: 'Healthcare' },
    { name: 'Yasemin Tuna', company: 'Kuehne+Nagel', tier: 'enterprise', sector: 'Logistics' },
];
const insertCustomer = sqlite.prepare('INSERT INTO customers (id, name, email, company, tier, sector, consent_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const customers = [];
for (const c of customerData) {
    const id = uuid();
    customers.push({ id, ...c });
    insertCustomer.run(id, c.name, `${c.name.toLowerCase().replace(/\s/g, '.')}@${c.company.toLowerCase().replace(/\s/g, '')}.com`, c.company, c.tier || 'basic', c.sector, 'granted', daysAgo(100));
}
// === REQUESTS ===
const requestTemplates = [
    // Logistics requests
    { title: 'Kargo takip numarası güncellenmiyor', desc: '3 gündür kargonuzun takip numarası sistemde görünmüyor. Müşterimiz sürekli şikayet ediyor.', custIdx: 0, sector: 'Logistics', cat: 'Delivery Delay', sub: 'Tracking Issue', channel: 'web', priority: 'high', sentiment: 'negative', slaH: 24, status: 'assigned', agentIdx: 0, teamIdx: 0, tags: '["kargo","takip","gecikme"]', conf: 87, explain: 'Yüksek öncelikli lojistik talebi. Kargo takip sorunu, acil müdahale gerektiriyor.' },
    { title: 'Sevkiyat gecikmesi - Üçüncü kez', desc: 'Müşterimiz siparişinin üçüncü kez geciktiğini ve sözleşmeyi feshetmekle tehdit ettiğini bildirdi. Acil aksiyon gerekiyor.', custIdx: 1, sector: 'Logistics', cat: 'Delivery Delay', sub: 'Repeated Delay', channel: 'email', priority: 'critical', sentiment: 'angry', slaH: 4, status: 'assigned', agentIdx: 0, teamIdx: 0, tags: '["gecikme","sözleşme","kritik"]', conf: 94, explain: 'Kritik seviyede müşteri kaybı riski. Tekrarlayan gecikme, acil yönetici onayı gerektirir.' },
    { title: 'Yurtdışı gönderi gümrük sorunu', desc: 'Almanya\'ya gönderilen kolinin gümrükte takıldığını bildirdiler. Evrakları kontrol eder misiniz?', custIdx: 12, sector: 'Logistics', cat: 'Delivery Delay', sub: 'Customs', channel: 'email', priority: 'medium', sentiment: 'neutral', slaH: 48, status: 'in_progress', agentIdx: 10, teamIdx: 0, tags: '["gümrük","yurtdışı","evrak"]', conf: 76, explain: 'Orta öncelikli gümrük talebi. Evrak kontrolü gerekiyor.' },
    { title: 'Teslimat adresi değişikliği', desc: 'Müşteri teslimat adresini değiştirmek istiyor. Kargo henüz dağıtıma çıkmadı.', custIdx: 18, sector: 'Logistics', cat: 'Delivery Delay', sub: 'Address Change', channel: 'phone', priority: 'low', sentiment: 'positive', slaH: 72, status: 'new', agentIdx: null, teamIdx: 0, tags: '["adres","teslimat"]', conf: 72, explain: 'Düşük öncelik, standart adres güncelleme talebi.' },
    { title: 'Parti halinde sevkiyat planlaması', desc: 'Aylık 5000+ sipariş için toplu sevkiyat protokolü hazırlamamız gerekiyor.', custIdx: 24, sector: 'Logistics', cat: 'Contract Update', sub: 'Bulk Shipping', channel: 'api', priority: 'high', sentiment: 'positive', slaH: 36, status: 'new', agentIdx: null, teamIdx: 0, tags: '["sevkiyat","protokol","toplu"]', conf: 81, explain: 'Yüksek hacimli lojistik sözleşme talebi, deneyimli ekip yönlendirmesi önerilir.' },
    // Telecom requests
    { title: 'Fiber internet kesintisi - Kadıköy', desc: 'Kadıköy bölgesinde geniş çaplı fiber internet kesintisi yaşanıyor. 200+ abone etkilendi.', custIdx: 2, sector: 'Telecom', cat: 'Outage Report', sub: 'Fiber', channel: 'api', priority: 'critical', sentiment: 'negative', slaH: 2, status: 'escalated', agentIdx: 2, teamIdx: 1, tags: '["kesinti","fiber","kadıköy"]', conf: 96, explain: 'Kritik seviye kesinti, geniş çaplı etki. Acilen saha ekibi yönlendirmesi gerekiyor.' },
    { title: 'Fatura itirazı - yanlış ücretlendirme', desc: 'Müşteri faturada olmayan bir hizmet için ücretlendirildiğini iddia ediyor. Fatura detaylarını inceleyin.', custIdx: 3, sector: 'Telecom', cat: 'Billing Problem', sub: 'Invoice Dispute', channel: 'web', priority: 'high', sentiment: 'angry', slaH: 12, status: 'in_progress', agentIdx: 3, teamIdx: 1, tags: '["fatura","ücret","itiraz"]', conf: 89, explain: 'Yüksek öncelikli fatura itirazı. Müşteri memnuniyeti risk altında.' },
    { title: 'Numara taşıma talebi', desc: 'Mevcut operatörden Turkcell\'e geçmek istiyor. Numara taşıma başvurusu yapacak.', custIdx: 13, sector: 'Telecom', cat: 'Contract Update', sub: 'Number Porting', channel: 'phone', priority: 'medium', sentiment: 'positive', slaH: 48, status: 'assigned', agentIdx: 3, teamIdx: 1, tags: '["numara","taşıma","geçiş"]', conf: 78, explain: 'Standart numara taşıma talebi, orta öncelik.' },
    { title: 'Santral yapılandırma desteği', desc: 'Yeni açılan ofis için santral kurulumu ve yapılandırma talep ediyoruz. 20 dahili hat.', custIdx: 19, sector: 'Telecom', cat: 'Technical Failure', sub: 'PBX Setup', channel: 'email', priority: 'medium', sentiment: 'neutral', slaH: 48, status: 'new', agentIdx: null, teamIdx: 1, tags: '["santral","pbx","yapılandırma"]', conf: 73, explain: 'Orta öncelikli teknik kurulum talebi.' },
    { title: 'Mobil hat aktivasyon sorunu', desc: 'Yeni alınan mobil hat 48 saattir aktif olmadı. Müşteri mağdur.', custIdx: 3, sector: 'Telecom', cat: 'Technical Failure', sub: 'Activation', channel: 'web', priority: 'high', sentiment: 'negative', slaH: 12, status: 'in_progress', agentIdx: 2, teamIdx: 1, tags: '["mobil","aktivasyon","hat"]', conf: 84, explain: 'Yüksek öncelik, hat aktivasyon gecikmesi müşteri memnuniyetini etkiliyor.' },
    // Marketing requests
    { title: 'Q3 kampanya onayı', desc: '2024 Q3 dijital kampanya bütçesi ve kreatif konsept onayı için yönetici imzası gerekiyor.', custIdx: 4, sector: 'Marketing', cat: 'Campaign Approval', sub: 'Budget Approval', channel: 'email', priority: 'high', sentiment: 'positive', slaH: 36, status: 'assigned', agentIdx: 4, teamIdx: 2, tags: '["kampanya","onay","q3","bütçe"]', conf: 85, explain: 'Yüksek öncelikli kampanya onay süreci, pazarlama koordinasyonu gerektiriyor.' },
    { title: 'Sosyal medya kriz yönetimi', desc: 'Markamız hakkında sosyal medyada yayılan olumsuz bir haber var. Acil kriz iletişim planı hazırlamalıyız.', custIdx: 5, sector: 'Marketing', cat: 'Customer Complaint', sub: 'Social Media Crisis', channel: 'web', priority: 'critical', sentiment: 'negative', slaH: 3, status: 'escalated', agentIdx: 5, teamIdx: 2, tags: '["sosyalmedya","kriz","pr"]', conf: 92, explain: 'Kritik kriz iletişimi. Acil müdahale gerekiyor.' },
    { title: 'Yeni ürün lansman briefi', desc: 'Önümüzdeki ay lansmanı yapılacak yeni ürün için kreatif brief hazırlanması gerekiyor.', custIdx: 14, sector: 'Marketing', cat: 'Campaign Approval', sub: 'Creative Brief', channel: 'email', priority: 'medium', sentiment: 'positive', slaH: 72, status: 'new', agentIdx: null, teamIdx: 2, tags: '["lansman","brief","kreatif"]', conf: 70, explain: 'Standart lansman brief talebi.' },
    { title: 'SEO performans raporu talebi', desc: 'Son çeyrek SEO performansını gösteren detaylı rapor hazırlanmasını talep ediyoruz.', custIdx: 5, sector: 'Marketing', cat: 'Data Request', sub: 'SEO Report', channel: 'web', priority: 'low', sentiment: 'neutral', slaH: 96, status: 'new', agentIdx: null, teamIdx: 2, tags: '["seo","rapor","performans"]', conf: 68, explain: 'Düşük öncelikli standart rapor talebi.' },
    // Finance requests
    { title: 'Toplu ödeme hatası - EFT başarısız', desc: 'Toplu maaş ödemeleri sırasında 23 çalışanın EFT\'si başarısız oldu. İşlem detayları ektedir.', custIdx: 6, sector: 'Finance', cat: 'Technical Failure', sub: 'Payment Error', channel: 'api', priority: 'critical', sentiment: 'angry', slaH: 2, status: 'in_progress', agentIdx: 6, teamIdx: 3, tags: '["eft","ödeme","başarısız"]', conf: 95, explain: 'Kritik ödeme hatası. Finansal işlem acil çözüm gerektiriyor.' },
    { title: 'Fatura düzeltme talebi', desc: 'Kesilen faturada matrah hatası var. Düzeltilmiş fatura düzenlenmesi gerekiyor.', custIdx: 7, sector: 'Finance', cat: 'Billing Problem', sub: 'Invoice Correction', channel: 'web', priority: 'high', sentiment: 'negative', slaH: 18, status: 'assigned', agentIdx: 7, teamIdx: 3, tags: '["fatura","düzeltme","matrah"]', conf: 83, explain: 'Yüksek öncelikli fatura düzeltme, muhasebe onayı gerektiriyor.' },
    { title: 'Yıllık vergi beyannamesi danışmanlık', desc: 'Kurumlar vergisi beyannamesi hazırlığı için mali danışmanlık hizmeti talep ediyoruz.', custIdx: 15, sector: 'Finance', cat: 'Compliance Question', sub: 'Tax Declaration', channel: 'email', priority: 'high', sentiment: 'neutral', slaH: 72, status: 'new', agentIdx: null, teamIdx: 3, tags: '["vergi","beyanname","danışmanlık"]', conf: 79, explain: 'Yüksek öncelikli vergi danışmanlık talebi.' },
    { title: 'Kredi başvurusu değerlendirme', desc: 'Ticari kredi başvurusu için finansal durum değerlendirme raporu talebi.', custIdx: 22, sector: 'Finance', cat: 'Data Request', sub: 'Credit Assessment', channel: 'email', priority: 'medium', sentiment: 'positive', slaH: 48, status: 'new', agentIdx: null, teamIdx: 3, tags: '["kredi","değerlendirme","rapor"]', conf: 74, explain: 'Orta öncelikli kredi değerlendirme talebi.' },
    // Retail requests
    { title: 'Stok sayım farkı - 150 adet eksik', desc: 'Depo sayımında 150 adet ürün eksik çıktı. Acil fiziksel sayım ve raporlama gerekiyor.', custIdx: 8, sector: 'Retail', cat: 'Technical Failure', sub: 'Inventory Issue', channel: 'api', priority: 'high', sentiment: 'negative', slaH: 12, status: 'in_progress', agentIdx: 8, teamIdx: 4, tags: '["stok","sayım","eksik"]', conf: 86, explain: 'Yüksek öncelikli stok sorunu, fiziksel doğrulama gerekiyor.' },
    { title: 'Online iade süreci hakkında bilgi', desc: 'Müşteri online aldığı ürünü iade etmek istiyor ancak süreci bilmiyor. Bilgilendirme yapın.', custIdx: 9, sector: 'Retail', cat: 'Refund Request', sub: 'Return Process', channel: 'phone', priority: 'low', sentiment: 'neutral', slaH: 72, status: 'assigned', agentIdx: 8, teamIdx: 4, tags: '["iade","online","bilgilendirme"]', conf: 65, explain: 'Düşük öncelikli standart iade bilgilendirme.' },
    { title: 'Mağaza açılış operasyonel destek', desc: 'Yeni AVM şubemizin açılışı için operasyonel destek ve ekip kurulumu talep ediyoruz.', custIdx: 16, sector: 'Retail', cat: 'Contract Update', sub: 'Store Opening', channel: 'email', priority: 'medium', sentiment: 'positive', slaH: 96, status: 'new', agentIdx: null, teamIdx: 4, tags: '["mağaza","açılış","operasyon"]', conf: 71, explain: 'Orta öncelikli mağaza açılış desteği.' },
    { title: 'Tedarikçi fiyat güncellemesi', desc: 'Tedarikçimiz yeni fiyat listesi gönderdi. Sözleşme güncellemesi için onay gerekiyor.', custIdx: 22, sector: 'Retail', cat: 'Contract Update', sub: 'Supplier', channel: 'email', priority: 'high', sentiment: 'neutral', slaH: 36, status: 'new', agentIdx: null, teamIdx: 4, tags: '["tedarikçi","fiyat","güncelleme"]', conf: 80, explain: 'Yüksek öncelikli tedarikçi sözleşme güncellemesi.' },
    // Healthcare requests
    { title: 'Hasta kayıt sisteminde veri tutarsızlığı', desc: 'HMS sisteminde 45 hastanın kaydında veri tutarsızlığı tespit edildi. Veri temizliği yapılması gerekiyor.', custIdx: 10, sector: 'Healthcare', cat: 'Technical Failure', sub: 'Data Inconsistency', channel: 'api', priority: 'critical', sentiment: 'negative', slaH: 6, status: 'escalated', agentIdx: 9, teamIdx: 5, tags: '["hms","veri","hasta","kritik"]', conf: 93, explain: 'Kritik veri tutarsızlığı, hasta güvenliği riski. Acil müdahale.' },
    { title: 'Randevu sistemi performans sorunu', desc: 'Online randevu sistemi yoğun saatlerde yavaşlıyor ve zaman aşımı hatası veriyor.', custIdx: 11, sector: 'Healthcare', cat: 'Technical Failure', sub: 'Performance', channel: 'web', priority: 'high', sentiment: 'negative', slaH: 24, status: 'in_progress', agentIdx: 9, teamIdx: 5, tags: '["randevu","performans","sistem"]', conf: 82, explain: 'Yüksek öncelikli sistem performans sorunu.' },
    { title: 'Hasta memnuniyet anketi sonuçları', desc: 'Aylık hasta memnuniyet anket sonuçlarını analiz etmemiz ve raporlamamız gerekiyor.', custIdx: 23, sector: 'Healthcare', cat: 'Data Request', sub: 'Survey Analysis', channel: 'email', priority: 'medium', sentiment: 'positive', slaH: 72, status: 'new', agentIdx: null, teamIdx: 5, tags: '["anket","memnuniyet","analiz"]', conf: 67, explain: 'Orta öncelikli standart analiz talebi.' },
    { title: 'Medikal cihaz bakım talebi', desc: 'MR cihazı periyodik bakım zamanı geldi. Teknik ekip yönlendirmesi rica ediyoruz.', custIdx: 17, sector: 'Healthcare', cat: 'Technical Failure', sub: 'Equipment Maintenance', channel: 'phone', priority: 'high', sentiment: 'neutral', slaH: 36, status: 'new', agentIdx: null, teamIdx: 5, tags: '["mr","bakım","medikal"]', conf: 77, explain: 'Yüksek öncelikli medikal cihaz bakım talebi.' },
    // More mixed requests
    { title: 'SLA ihlal raporu hazırlama', desc: 'Geçen ayki SLA performansımızı gösteren detaylı rapor hazırlanması gerekiyor.', custIdx: 6, sector: 'Finance', cat: 'Data Request', sub: 'SLA Report', channel: 'email', priority: 'medium', sentiment: 'neutral', slaH: 48, status: 'new', agentIdx: null, teamIdx: 3, tags: '["sla","rapor","performans"]', conf: 73, explain: 'Orta öncelikli SLA rapor talebi.' },
    { title: 'GDPR veri silme talebi', desc: 'Müşterimiz GDPR kapsamında tüm verilerinin silinmesini talep ediyor. Yasal süreç başlatılmalı.', custIdx: 15, sector: 'Finance', cat: 'Compliance Question', sub: 'GDPR', channel: 'email', priority: 'high', sentiment: 'negative', slaH: 72, status: 'new', agentIdx: null, teamIdx: 3, tags: '["gdpr","veri","silme","yasal"]', conf: 88, explain: 'Yüksek öncelikli GDPR uyum talebi, yasal süreç başlatılmalı.' },
    { title: 'Kampanya performans değerlendirmesi', desc: 'Haziran ayı kampanyalarının ROI analizi ve performans raporu talep ediyoruz.', custIdx: 4, sector: 'Marketing', cat: 'Data Request', sub: 'Campaign Analytics', channel: 'web', priority: 'medium', sentiment: 'positive', slaH: 72, status: 'new', agentIdx: null, teamIdx: 2, tags: '["kampanya","roi","analiz"]', conf: 72, explain: 'Orta öncelikli kampanya analiz talebi.' },
];
const insertRequest = sqlite.prepare('INSERT INTO requests (id, title, description, customer_id, sector, channel, category, subcategory, priority, status, sentiment, sla_deadline, assigned_agent_id, assigned_team_id, tags, ai_confidence, ai_summary, ai_explanation, estimated_resolution_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertEvent = sqlite.prepare('INSERT INTO request_events (id, request_id, event_type, old_value, new_value, actor_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const insertRec = sqlite.prepare('INSERT INTO assignment_recommendations (id, request_id, recommended_agent_id, recommended_team_id, score, confidence, explanation, alternative_agents, accepted, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
// Generate resolved requests too
const resolvedRequests = [];
for (let i = 0; i < 15; i++) {
    const tpl = requestTemplates[i % requestTemplates.length];
    resolvedRequests.push({ ...tpl, status: 'resolved' });
}
const allRequests = [...requestTemplates, ...resolvedRequests];
for (let i = 0; i < allRequests.length; i++) {
    const r = allRequests[i];
    const cust = customers[r.custIdx % customers.length];
    const reqId = `REQ-${String(i + 1).padStart(4, '0')}`;
    const isResolved = r.status === 'resolved';
    const created = isResolved ? daysAgo(Math.floor(Math.random() * 10) + 5) : i < 3 ? hoursAgo(i + 1) : daysAgo(Math.floor(Math.random() * 5));
    const slaDate = new Date(new Date(created).getTime() + (r.slaH || 24) * 3600000);
    const resolvedAt = isResolved ? new Date(new Date(created).getTime() + (Math.random() * 12 + 2) * 3600000).toISOString() : null;
    insertRequest.run(reqId, r.title, r.desc, cust.id, r.sector, r.channel, r.cat, r.sub || null, r.priority, r.status, r.sentiment, slaDate.toISOString(), r.agentIdx !== null ? agents[r.agentIdx].id : null, r.teamIdx !== null ? teams[r.teamIdx].id : null, r.tags, r.conf, `${r.cat} - ${r.sub || r.sector}`, r.explain, Math.floor(Math.random() * 240 + 30), created, isResolved ? resolvedAt : new Date().toISOString());
    // Events
    insertEvent.run(uuid(), reqId, 'created', null, 'new', users[0].id, 'Talep oluşturuldu', created);
    if (r.status !== 'new') {
        insertEvent.run(uuid(), reqId, 'ai_analyzed', null, r.cat, null, `Yapay zeka analizi: ${r.cat} - %${r.conf} güven`, hoursAgo(Math.floor(Math.random() * 12) + 1));
        insertEvent.run(uuid(), reqId, 'status_change', 'new', 'analyzing', null, 'AI analiz başlatıldı', hoursAgo(Math.floor(Math.random() * 12) + 1));
    }
    if (r.agentIdx !== null) {
        const agent = agents[r.agentIdx];
        insertEvent.run(uuid(), reqId, 'status_change', 'analyzing', 'assigned', users[1].id, `${agentConfigs[r.agentIdx].role} atandı`, hoursAgo(Math.floor(Math.random() * 10) + 1));
        insertEvent.run(uuid(), reqId, 'assigned', null, agent.id, users[1].id, 'AI önerisi ile atama yapıldı', hoursAgo(Math.floor(Math.random() * 10) + 1));
        // Assignment recommendation
        const altAgents = agents.filter(a => a.id !== agent.id).slice(0, 3).map(a => {
            const agentUser = users.find(u => u.id === a.userId);
            return {
                agentId: a.id,
                agentName: agentUser?.name || 'Unknown',
                score: Math.round((Math.random() * 30 + 50)),
                skillMatch: Math.round(Math.random() * 30 + 60),
                availability: Math.round(Math.random() * 30 + 60),
                workloadBalance: Math.round(Math.random() * 30 + 60),
                historicalSuccess: Math.round(Math.random() * 30 + 60),
                sectorExperience: Math.round(Math.random() * 30 + 60),
                slaFit: Math.round(Math.random() * 30 + 60),
                explanation: `Alternatif atama değerlendirmesi`,
            };
        });
        const team = teams[r.teamIdx];
        if (!team)
            throw new Error(`No team at index ${r.teamIdx} for request ${reqId}`);
        insertRec.run(uuid(), reqId, agent.id, team.id, Math.round(Math.random() * 20 + 75), r.conf, r.explain, JSON.stringify(altAgents), 1, hoursAgo(Math.floor(Math.random() * 10) + 1));
    }
    if (r.status === 'in_progress') {
        insertEvent.run(uuid(), reqId, 'status_change', 'assigned', 'in_progress', r.agentIdx !== null ? agents[r.agentIdx].userId : null, 'Çalışma başlatıldı', hoursAgo(Math.floor(Math.random() * 6) + 1));
    }
    if (r.status === 'escalated') {
        insertEvent.run(uuid(), reqId, 'status_change', 'in_progress', 'escalated', users[1].id, 'Kritik seviye - üst yönetime yükseltildi', hoursAgo(Math.floor(Math.random() * 3) + 1));
    }
    if (isResolved && resolvedAt) {
        insertEvent.run(uuid(), reqId, 'status_change', 'in_progress', 'resolved', r.agentIdx !== null ? agents[r.agentIdx].userId : null, 'Talep çözüldü', resolvedAt);
    }
}
// === AUTOMATION RULES ===
const ruleData = [
    { name: 'Kritik SLA İhlal Yükseltme', desc: 'Kritik öncelikli ve yüksek SLA riski taşıyan talepleri kıdemli ekibe yükselt', conds: JSON.stringify({ priority: 'critical', slaRisk: 'high' }), acts: JSON.stringify({ action: 'escalate_to_senior', notify: ['manager'] }), enabled: true },
    { name: 'Negatif Duygu Bildirimi', desc: 'Negatif duygu ve Enterprise müşteri ise yöneticiye bildir', conds: JSON.stringify({ sentiment: 'negative', customerTier: 'enterprise' }), acts: JSON.stringify({ action: 'notify_manager', priority: 'high' }), enabled: true },
    { name: 'Fatura Talebi Yönlendirme', desc: 'Fatura kategorisindeki talepleri Finans Operasyon ekibine yönlendir', conds: JSON.stringify({ category: 'Billing Problem' }), acts: JSON.stringify({ action: 'route_to_team', team: 'Finans Operasyon' }), enabled: true },
    { name: 'Aşırı Yük Uyarısı', desc: 'Ajan iş yükü %90 üzerinde ise yeni atama yapma', conds: JSON.stringify({ agentWorkload: '>90' }), acts: JSON.stringify({ action: 'block_assignment', notify: ['team_lead'] }), enabled: false },
    { name: 'Bekleyen Talep Hatırlatma', desc: '4 saat boyunca müşteri yanıtı bekleyen talepler için hatırlatma gönder', conds: JSON.stringify({ status: 'waiting_customer', duration_hours: 4 }), acts: JSON.stringify({ action: 'send_reminder', channel: 'email' }), enabled: true },
];
const insertRule = sqlite.prepare('INSERT INTO automation_rules (id, name, description, conditions, actions, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
for (const r of ruleData)
    insertRule.run(uuid(), r.name, r.desc, r.conds, r.acts, r.enabled ? 1 : 0, daysAgo(45));
// === REPORTS ===
const reportData = [
    { name: 'Aylık Operasyonel Performans Raporu', type: 'operational_performance', summary: 'Bu ay toplam 47 talep açıldı, 38\'i çözüldü. Ortalama çözüm süresi 3.2 saat. AI atama oranı %84.' },
    { name: 'Haftalık SLA Uyum Raporu', type: 'sla_compliance', summary: 'SLA uyum oranı %92. En yüksek ihlal oranı Telekom sektöründe (%8).' },
    { name: 'Q2 Talep Hacim Analizi', type: 'request_volume', summary: 'Q2\'de talep hacmi bir önceki çeyreğe göre %18 arttı. Lojistik sektörü en büyük katkıyı sağladı.' },
    { name: 'Ajan Performans Değerlendirmesi', type: 'agent_performance', summary: 'En yüksek performans: Zeynep Demir (%96 memnuniyet, 2.1h ortalama çözüm).' },
    { name: 'Müşteri Memnuniyet Raporu', type: 'customer_satisfaction', summary: 'Genel memnuniyet skoru 4.3/5.0. En memnun sektör: Sağlık (%4.7).' },
];
const insertReport = sqlite.prepare('INSERT INTO reports (id, name, type, filters, generated_by, summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
for (const r of reportData) {
    insertReport.run(uuid(), r.name, r.type, '{}', users[3].id, r.summary, daysAgo(Math.floor(Math.random() * 15) + 1));
}
// === AUDIT LOGS ===
for (let i = 0; i < 30; i++) {
    const actions = ['request.created', 'request.assigned', 'request.status_changed', 'ai.analysis', 'user.login', 'settings.updated', 'rule.created', 'report.generated'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    sqlite.prepare('INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(uuid(), users[Math.floor(Math.random() * users.length)].id, action, action.split('.')[0], `REQ-${String(Math.floor(Math.random() * 30) + 1).padStart(4, '0')}`, '{}', hoursAgo(Math.floor(Math.random() * 72)));
}
// === AI MODEL RUNS ===
const modelNames = ['demand_forecast', 'sla_risk', 'agent_recommendation', 'sentiment_classification', 'category_classification'];
for (let i = 0; i < 20; i++) {
    const model = modelNames[Math.floor(Math.random() * modelNames.length)];
    const conf = Math.round((Math.random() * 15 + 80) * 10) / 10;
    sqlite.prepare('INSERT INTO ai_model_runs (id, model_name, input_snapshot, output_snapshot, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(uuid(), model, '{"sample":"data"}', '{"result":"simulated"}', conf, hoursAgo(Math.floor(Math.random() * 72)));
}
sqlite.close();
console.log('✅ Database seeded successfully!');
console.log('📊 Users: 15');
console.log('📊 Teams: 6');
console.log('📊 Agents: 11');
console.log('📊 Customers: 25');
console.log('📊 Requests: ' + allRequests.length);
console.log('📊 Automation Rules: 5');
console.log('📊 Reports: 5');
console.log('📊 Audit Logs: 30');
console.log('📊 AI Model Runs: 20');
console.log('\n🔑 Demo Credentials:');
console.log('   admin@yoyo.ai / admin');
console.log('   manager@yoyo.ai / manager');
console.log('   agent@yoyo.ai / agent');
console.log('   analyst@yoyo.ai / analyst');
console.log('   viewer@yoyo.ai / viewer');
//# sourceMappingURL=seed.js.map