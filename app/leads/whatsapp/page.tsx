import LeadsFiltered from "@/components/leads/LeadsFiltered";

export default function LeadsWhatsAppPage() {
  return (
    <LeadsFiltered
      canal="whatsapp"
      title="Leads de WhatsApp"
      subtitle="Contactos que llegaron por WhatsApp."
      accentColor="emerald"
    />
  );
}
