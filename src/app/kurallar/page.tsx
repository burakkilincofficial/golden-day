import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Calendar, Gift, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Vizyon & Misyon - GoldDay Manager",
  description: "Altın günü grubumuzun vizyonu, misyonu ve kuralları"
};

export default function KurallarPage() {
  const rules = [
    {
      number: 1,
      title: "Başlangıç Tarihi",
      content: "Ocak 2026'dan başlayarak her ay 1 arkadaşımıza altınlar takdim edilecektir."
    },
    {
      number: 2,
      title: "Kura ve Öncelik",
      content: "Hangi ay kime verileceği kura ile belirlenecek olup, acil ihtiyacı olan arkadaşlarımıza herkesin onayı ile öncelik verilecektir."
    },
    {
      number: 3,
      title: "Altın Özellikleri",
      content: "Altın kişi başı 2 gram (2 tane 1 gram) 24 ayar olacaktır."
    },
    {
      number: 4,
      title: "Teslimat Zamanı",
      content: "Altınlar her ayın ilk haftası ofiste verilecektir. O ay kimde ise o kişinin ofiste olduğu gün ya da günlere denk getirilerek ofise gelip kendiniz teslim edebilir ya da başka birine o kişiye iletmek üzere verebilirsiniz."
    },
    {
      number: 5,
      title: "Toplanma Günü",
      content: "Hangi gün toplanacağı bu grupta önceden yazışılacaktır."
    },
    {
      number: 6,
      title: "Fiziksel Teslimat",
      content: "Altınla fiziksel altın olarak getirilmek zorundadır. Eğer çok istisnai durumlar olur ise (hastalık, uzun süre şehir dışında ya da doğum izninde olma hali) alacak kişi ile anlaşılarak para transferi suretiyle gönderim yapılabilir."
    },
    {
      number: 7,
      title: "İstisnai Durumlar",
      content: "İstisnai durumlar bir önceki maddede belirtilmiş olup, bu durumlar dışındaki istisnalar kabul edilmeyecektir."
    },
    {
      number: 8,
      title: "İkram ve Aktivite",
      content: "Ofiste takdim günlerinde ikram ya da grupça beraber aktivite gibi bir zorunluluk yoktur. Dilersek belki 1 kez Altın grubu olarak beraber yemek yiyebiliriz."
    },
    {
      number: 9,
      title: "Teslimat Notu",
      content: "Altınları o ay teslim alan kişinin kimden teslim alıp almadığını not etmesi kendi çıkarınadır."
    },
    {
      number: 10,
      title: "Teslimat Kaydı",
      content: "Altını teslim eden bu gruba teslim ettiğini yazarak teslimatını kayıt altına alabilir."
    },
    {
      number: 11,
      title: "Sorumluluk",
      content: "Teslim edilen altınlar teslimattan sonra tamamen alacaklının sorumluluğundadır. Ben kaybettim, ofiste çekmeceme koymuştum gibi söylemler dikkate alınmayacaktır."
    },
    {
      number: 12,
      title: "Kura Sonuçları",
      content: "Kura sonuçları 12.12.2025 tarihinde grupta açıklanacaktır."
    },
    {
      number: 13,
      title: "Gruptan Ayrılma",
      content: "Gruptan ayrılmak isteyen isteğini yazılı olarak beyan etmek durumundadır. Ayrılan kişi yerine yeni biri bulunacaktır. Zorunlu haller dışında ayrılmak kabul edilemez."
    },
    {
      number: 14,
      title: "İş Değişikliği",
      content: "İş değişikliği durumunda kişi yine de güne devam edebilir. Altınını yine bir şekilde teslim edebilir ya da ayrılma talep edebilir."
    },
    {
      number: 15,
      title: "Hayırlı Olsun",
      content: "Hepimize hayırlı olsun."
    }
  ];

  return (
    <div className="space-y-8">
      {/* Vizyon & Misyon Bölümü */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gold/10 p-2">
            <BookOpen className="h-6 w-6 text-gold" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vizyon & Misyon</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Altın Günü Grubumuzun Temel İlkeleri
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-gold" />
                <CardTitle>Vizyonumuz</CardTitle>
              </div>
              <CardDescription>
                Uzun vadeli hedefimiz ve hayalimiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Arkadaşlarımız arasında dayanışmayı güçlendirmek, karşılıklı güven ve 
                saygı temelinde, her ay bir arkadaşımıza altın takdim ederek hem maddi 
                hem de manevi destek sağlamak. Bu gelenekle, birlik ve beraberlik içinde 
                büyüyen, sürdürülebilir bir dayanışma ağı oluşturmak.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-gold" />
                <CardTitle>Misyonumuz</CardTitle>
              </div>
              <CardDescription>
                Nasıl çalıştığımız ve ne yaptığımız
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Adil ve şeffaf bir kura sistemi ile, Ocak 2026'dan itibaren her ay 
                bir arkadaşımıza 2 gram 24 ayar altın takdim etmek. Acil ihtiyacı olanlara 
                öncelik tanıyarak, esnek ve anlayışlı bir yaklaşımla, tüm üyelerimizin 
                memnuniyetini sağlamak ve grubun sürekliliğini korumak.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Kurallar Bölümü */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gold/10 p-2">
            <FileText className="h-6 w-6 text-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Grup Kuralları</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Altın Günü grubumuzun işleyişini düzenleyen kurallar
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {rules.map((rule, index) => (
            <Card 
              key={rule.number} 
              className="transition-all hover:border-gold/50 hover:shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold font-semibold">
                      {rule.number}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-base">{rule.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {rule.content}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Önemli Notlar */}
      <section>
        <Card className="border-gold/30 bg-gold/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-gold" />
              <CardTitle className="text-lg">Önemli Hatırlatmalar</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Kura Sonuçları</p>
                <p className="text-muted-foreground">
                  Kura sonuçları <span className="font-semibold text-gold">12 Aralık 2025</span> tarihinde grupta açıklanacaktır.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Sorumluluk</p>
                <p className="text-muted-foreground">
                  Teslim edilen altınlar teslimattan sonra tamamen alacaklının sorumluluğundadır. 
                  Lütfen altınlarınızı güvenli bir yerde saklayın.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">İletişim</p>
                <p className="text-muted-foreground">
                  Tüm iletişim ve koordinasyon grup üzerinden yapılacaktır. 
                  Toplanma günleri ve özel durumlar grup içinde paylaşılacaktır.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

