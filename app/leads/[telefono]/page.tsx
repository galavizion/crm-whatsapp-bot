import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  User,
  Tag,
  FileText,
} from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";

interface Props {
  params: {
    telefono: string;
  };
}

export default async function LeadDetailPage({ params }: Props) {
  const telefono = params.telefono;

  const { data: lead, error } = await supabaseServer
    .from("contactos")
    .select("*")
    .eq("whatsapp", telefono)
    .maybeSingle();

  if (!lead || error) {
    return (
      <div className="space-y-6">
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
        >
          <ArrowLeft size={16} />
          Volver a leads
        </Link>

        <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Lead no encontrado
          </h1>
        </div>
      </div>
    );
  }

  const phone = lead.whatsapp;
  const whatsappPhone = normalizeMexPhone(phone);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
          >
            <ArrowLeft size={16} />
            Volver a leads
          </Link>

          <p className="mt-5 text-sm uppercase text-gray-500">
            Ficha del lead
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {lead.nombre || "Sin nombre"}
          </h1>

          <div className="mt-4 flex flex-wrap gap-3">
            <StatusBadge status={lead.estado || "Sin estado"} />

            <span className="badge">
              <Phone size={14} />
              {phone}
            </span>

            <span className="badge">
              <User size={14} />
              WhatsApp Lead
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          {whatsappPhone && (
            <a
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              className="btn-primary"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Card title="Resumen de conversación">
            {lead.resumen || "Sin resumen disponible"}
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <InfoCard title="Último tema" value={lead.ultimo_tema || "-"} />
            <InfoCard title="Necesidad" value={lead.necesidad || "-"} />
          </div>

          <Card title="Última respuesta del bot">
            {lead.ultima_respuesta || "Sin respuesta"}
          </Card>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="title">Información</h2>

            <KeyValue label="Nombre" value={lead.nombre || "-"} />
            <KeyValue label="Teléfono" value={phone} />
            <KeyValue label="Estado" value={lead.estado || "-"} />
            <KeyValue
              label="Contactos"
              value={String(lead.veces_contacto ?? 0)}
            />
          </div>

          <div className="card">
            <h2 className="title">Clasificación</h2>

            <KeyValue label="Estado" value={lead.estado || "-"} />
            <KeyValue label="Necesidad" value={lead.necesidad || "-"} />
          </div>
        </div>
      </section>
    </div>
  );
}

/* COMPONENTES */

function Card({ title, children }: any) {
  return (
    <div className="card">
      <h2 className="title">{title}</h2>
      <p className="text-sm mt-3">{children}</p>
    </div>
  );
}

function InfoCard({ title, value }: any) {
  return (
    <div className="card">
      <h3 className="subtitle">{title}</h3>
      <p>{value}</p>
    </div>
  );
}

function KeyValue({ label, value }: any) {
  return (
    <div className="flex justify-between text-sm py-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: any) {
  return <span className="badge">{status}</span>;
}

function normalizeMexPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) return `52${cleaned}`;
  return cleaned;
}