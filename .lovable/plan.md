

## პრობლემა
- იუზერი მოითხოვს ავტომატურ მეილებს (რეგისტრაცია + გადახდა)
- Domain არ აქვს და არ სურს ყიდვა
- Lovable Email **მოითხოვს** verified domain-ს — შარედ sender არ არსებობს

## 3 ალტერნატივა

### **ვარიანტი A: SMS-ით ჩავანაცვლოთ მეილი** ⭐ (რეკომენდებული)
- იუზერს უკვე აქვს SMS infrastructure (Magti/Twilio) `useSmsSettings` hook-ით
- რეგისტრაციის და გადახდის შეტყობინებები SMS-ით გაიგზავნება მშობლის ტელეფონზე
- **ღირებულება**: SMS-ის ერთეული (≈$0.02-0.05 თითო), მაგრამ ისედაც გაქვს Magti/Twilio ანგარიში
- **სამუშაო**: შაბლონების შექმნა + trigger-ები `players` insert-სა და `payments` "paid" update-ზე

### **ვარიანტი B: Resend.com-ის უფასო Tier**
- 3,000 მეილი თვეში სრულიად უფასოდ, **მხოლოდ test domain-ით** (`onboarding@resend.dev`)
- **მინუსი**: From email = `onboarding@resend.dev` (არა კლუბის სახელი)
- From Name კლუბის სახელით ჩანს, მაგრამ მისამართი generic-ია
- **სამუშაო**: Resend API key + edge function-ები

### **ვარიანტი C: მოგვიანებით დავამატოთ მეილი როცა domain-ს იშოვი**
- ახლა მხოლოდ SMS-ით გავაკეთოთ
- მერე როცა domain გექნება, მეილიც დავამატოთ paralel-ად

## ჩემი რეკომენდაცია: **ვარიანტი A (SMS-ით)**

**მიზეზი**:
- უკვე გაქვს SMS settings UI და hook
- მშობლები უფრო ხშირად კითხულობენ SMS-ს ვიდრე მეილს
- არ სჭირდება domain, DNS, ვერიფიკაცია
- შენი სამიზნე აუდიტორია (ქართული კლუბები) უკვე იყენებს SMS-ს

## მხოლოდ თუ ვარიანტი A აირჩევ, შემდეგი ნაბიჯები:

1. **SMS შაბლონების შექმნა** ქართულად 3 event-ისთვის:
   - **რეგისტრაცია**: "გამარჯობა! თქვენი შვილი {playerName} წარმატებით დარეგისტრირდა {clubName}-ში ({sportName})."
   - **გადახდის გრაფიკი**: "{playerName}-ის გადახდის გრაფიკი {clubName}-ში: {months} თვე, ყოველთვიური თანხა {amount}₾. პირველი გადახდის ვადა: {firstDueDate}."
   - **გადახდის დადასტურება**: "მადლობა! {playerName}-ის გადახდა {amount}₾ ({monthLabel}) წარმატებით ჩაირიცხა {clubName}-ში."

2. **Trigger logic**:
   - `usePlayers.addPlayer()` → ორივე მესიჯის გაგზავნა (რეგისტრაცია + გრაფიკი)
   - `usePayments.markAsPaid()` → დადასტურების მესიჯი

3. **გაგზავნა existing edge function-ით** (`send-payment-sms`-ის ანალოგიური):
   - წავიკითხოთ `user_sms_settings` (provider: magti/twilio)
   - გამოვიყენოთ `email_from_name` ან ცალკე `club_name` field როგორც `{clubName}`
   - მშობლის ტელეფონი — `players.parent_phone` ან მსგავსი ველი

4. **UI dashboard**: "გაგზავნილი შეტყობინებები" log table-ით (status, timestamp, recipient)

