import LeadsFiltered from "@/components/leads/LeadsFiltered";

export default function LeadsInstagramPage() {
  return (
    <LeadsFiltered
      canal="instagram"
      title="Leads de Instagram"
      subtitle="Contactos que llegaron por mensajes directos o comentarios de Instagram."
      accentColor="pink"
    />
  );
}
