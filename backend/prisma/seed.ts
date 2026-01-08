import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed başlatılıyor...');

  // Kullanıcılar oluştur
  const hashedPassword = await bcrypt.hash('123456', 10);

  const users = [];
  const usernames = [
    'admin', 'moderator', 'testuser1', 'testuser2', 
    'ahmet_yilmaz', 'ayse_demir', 'mehmet_kaya', 'fatma_ozturk',
    'ali_celik', 'zeynep_arslan', 'mustafa_yildiz', 'esra_polat',
    'emre_sahin', 'selin_koc', 'burak_yildirim'
  ];

  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    let role = 'USER';
    if (username === 'admin') role = 'ADMIN';
    else if (username === 'moderator') role = 'MODERATOR';

    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        email: `${username}@example.com`,
        passwordHash: hashedPassword,
        role: role as any,
      },
    });
    users.push(user);
  }

  console.log(`✅ ${users.length} kullanıcı oluşturuldu`);

  // Başlıklar oluştur
  const topicTitles = [
    'Yapay Zeka ve Gelecek',
    'En İyi Programlama Dilleri 2024',
    'Türkiye\'de Yazılım Sektörü',
    'Remote Çalışma Deneyimleri',
    'Startup Dünyası ve Girişimcilik',
    'Web Geliştirme Araçları',
    'Mobil Uygulama Geliştirme',
    'Veritabanı Yönetimi ve Optimizasyon',
    'DevOps ve CI/CD Pipeline',
    'Cloud Computing Teknolojileri',
    'Siber Güvenlik ve Etik Hacking',
    'Blockchain ve Kripto Paralar',
    'Game Development ve Unity',
    'UI/UX Tasarım İlkeleri',
    'Agile ve Scrum Metodolojisi',
    'Docker ve Kubernetes',
    'Machine Learning ve Data Science',
    'Frontend Framework Karşılaştırması',
    'Backend Mimarileri ve Mikroservisler',
    'Açık Kaynak Projelere Katkı',
    'Freelance Yazılımcı Olmak',
    'Kariyer Gelişimi ve Networking',
    'Code Review Best Practices',
    'Test Driven Development',
    'Git ve Version Control',
    'API Design ve REST Standartları',
    'GraphQL vs REST API',
    'NoSQL vs SQL Veritabanları',
    'Linux İşletim Sistemi',
    'Vim ve Terminal Komutları'
  ];

  const createdTopics = [];
  for (let i = 0; i < topicTitles.length; i++) {
    const title = topicTitles[i];
    const slug = title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const topic = await prisma.topic.upsert({
      where: { slug },
      update: {},
      create: {
        title,
        slug,
        createdBy: users[i % users.length].id,
      },
    });
    createdTopics.push(topic);
  }

  console.log(`✅ ${createdTopics.length} başlık oluşturuldu`);

  // Entryler oluştur - Her başlık için 5-15 entry
  const entryContents = [
    'Çok ilginç bir konu. Benim de benzer deneyimlerim oldu.',
    'Katılıyorum, kesinlikle önemli bir nokta.',
    'Alternatif bir bakış açısı sunmak gerekirse...',
    'Bence bu konuda daha fazla araştırma yapılmalı.',
    'Harika bir özet. Eline sağlık!',
    'Tam olarak aynı fikirdeyim.',
    'Bu yaklaşım bence daha mantıklı olur.',
    'Deneyimlerime göre biraz farklı düşünüyorum.',
    'Çok detaylı açıklamışsın, teşekkürler.',
    'Bu konuda başka kaynaklar var mı?',
    'Gerçekten faydalı bilgiler paylaşmışsın.',
    'Benim projemde de benzer bir durum yaşadım.',
    'Bu framework\'ü denedim ve memnun kaldım.',
    'Daha performanslı bir çözüm olabilir mi acaba?',
    'Security açısından dikkat edilmesi gereken noktalar var.',
    'Test coverage konusunda ne düşünüyorsunuz?',
    'Production ortamında nasıl davranır?',
    'Scalability konusunda endişelerim var.',
    'Dokümantasyon çok önemli bu konuda.',
    'Community support iyi mi peki?',
    'Learning curve nasıl?',
    'Best practice olarak ne önerirsiniz?',
    'Debugging zor olmuyor mu?',
    'Migration yaparken dikkat edilmesi gerekenler?',
    'Hangi use case\'ler için uygun?',
  ];

  let totalEntries = 0;
  for (const topic of createdTopics) {
    const entryCount = Math.floor(Math.random() * 11) + 5; // 5-15 arası
    for (let i = 0; i < entryCount; i++) {
      const content = entryContents[Math.floor(Math.random() * entryContents.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      
      await prisma.entry.create({
        data: {
          content: `${content} (Topic: ${topic.title})`,
          topicId: topic.id,
          userId: user.id,
        },
      });
      totalEntries++;
    }
  }

  console.log(`✅ ${totalEntries} entry oluşturuldu`);

  // Rastgele oylar oluştur
  const allEntries = await prisma.entry.findMany();
  let voteCount = 0;
  for (const entry of allEntries) {
    // Her entry için rastgele 0-5 oy
    const voteAmount = Math.floor(Math.random() * 6);
    for (let i = 0; i < voteAmount; i++) {
      const voter = users[Math.floor(Math.random() * users.length)];
      if (voter.id === entry.userId) continue; // Kendi entry'sine oy veremez
      
      const value = Math.random() > 0.3 ? 1 : -1; // %70 pozitif, %30 negatif
      
      try {
        await prisma.vote.create({
          data: {
            entryId: entry.id,
            userId: voter.id,
            value,
          },
        });
        voteCount++;
      } catch (e) {
        // Duplicate vote - skip
      }
    }
  }

  console.log(`✅ ${voteCount} oy oluşturuldu`);

  console.log('\n🎉 Seed tamamlandı!');
  console.log('\nTest kullanıcıları:');
  console.log('  - admin / 123456 (ADMIN) 👑');
  console.log('  - moderator / 123456 (MODERATOR)');
  console.log('  - testuser1 / 123456 (USER)');
  console.log('  - testuser2 / 123456 (USER)');
  console.log('  + 11 ekstra kullanıcı daha');
  console.log(`\n📊 Toplam:`);
  console.log(`  - ${users.length} kullanıcı`);
  console.log(`  - ${createdTopics.length} başlık`);
  console.log(`  - ${totalEntries} entry`);
  console.log(`  - ${voteCount} oy`);
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
