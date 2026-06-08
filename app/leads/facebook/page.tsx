import LeadsFiltered from "@/components/leads/LeadsFiltered";

export default function LeadsFacebookPage() {
  return (
    <LeadsFiltered
      canal="facebook"
      title="Leads de Facebook"
      subtitle="Contactos que llegaron por Messenger o comentarios de Facebook."
      accentColor="blue"
    />
  );
}
