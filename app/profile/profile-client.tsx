"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Initial = {
  email: string;
  paused: boolean;
  planHint?: string;

  // Legacy (se siguen guardando por compatibilidad)
  fullName: string;
  dni: string;
  cuil: string;
  address: string;
  phone: string;

  // Extendidos
  firstName?: string;
  middleName?: string;
  lastName?: string;
  street?: string;
  streetNumber?: string;
  locality?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  dniType?: string;
  dniNumber?: string;
  dniFrontPath?: string;
  dniBackPath?: string;
};

type Props = {
  next: string;
  initial: Initial;
};

function onlyDigits(input: string) {
  return String(input || "").replace(/\D+/g, "");
}

function joinName(first: string, middle: string, last: string) {
  return [first, middle, last].map((s) => s.trim()).filter(Boolean).join(" ").trim();
}

function buildAddress({
  street,
  streetNumber,
  locality,
  city,
  province,
  country,
  postalCode,
}: {
  street: string;
  streetNumber: string;
  locality: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}) {
  const line1 = [street.trim(), streetNumber.trim()].filter(Boolean).join(" ").trim();
  const cp = postalCode.trim() ? `CP ${postalCode.trim()}` : "";
  return [line1, locality.trim(), city.trim(), province.trim(), country.trim(), cp].filter(Boolean).join(", ").trim();
}

function missingFields(state: {
  firstName: string;
  lastName: string;
  street: string;
  streetNumber: string;
  locality: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  mobile: string;
  dniType: string;
  dniNumber: string;
  cuil: string;
  dniFrontPath: string;
  dniBackPath: string;
}) {
  const missing: string[] = [];

  if (!state.firstName.trim()) missing.push("Nombre *");
  if (!state.lastName.trim()) missing.push("Apellido *");
  if (!state.mobile.trim()) missing.push("Teléfono móvil *");
  if (!state.dniType.trim()) missing.push("Tipo DNI *");
  if (!onlyDigits(state.dniNumber)) missing.push("DNI número *");

  // Recomendados (no bloqueantes)
  if (!state.street.trim()) missing.push("Calle (recomendado)");
  if (!state.streetNumber.trim()) missing.push("Altura (recomendado)");
  if (!state.city.trim()) missing.push("Ciudad (recomendado)");
  if (!state.province.trim()) missing.push("Provincia (recomendado)");
  if (!state.country.trim()) missing.push("País (recomendado)");
  if (!onlyDigits(state.cuil)) missing.push("CUIT/CUIL (recomendado)");
  if (!state.dniFrontPath) missing.push("DNI frente (recomendado)");
  if (!state.dniBackPath) missing.push("DNI dorso (recomendado)");

  return missing;
}

async function uploadIdDoc(side: "front" | "back", file: File) {
  const fd = new FormData();
  fd.set("side", side);
  fd.set("file", file);

  const res = await fetch("/api/profile/id-doc", {
    method: "POST",
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || "upload_failed";
    throw new Error(msg);
  }

  return data as { ok: true; path: string; side: "front" | "back" };
}

export default function ProfileClient({ next, initial }: Props) {
  const [firstName, setFirstName] = useState(initial.firstName || "");
  const [middleName, setMiddleName] = useState(initial.middleName || "");
  const [lastName, setLastName] = useState(initial.lastName || "");

  const [street, setStreet] = useState(initial.street || "");
  const [streetNumber, setStreetNumber] = useState(initial.streetNumber || "");
  const [locality, setLocality] = useState(initial.locality || "");
  const [city, setCity] = useState(initial.city || "");
  const [province, setProvince] = useState(initial.province || "");
  const [country, setCountry] = useState(initial.country || "Argentina");
  const [postalCode, setPostalCode] = useState(initial.postalCode || "");

  const [mobile, setMobile] = useState(initial.phone || "");
  const [dniType, setDniType] = useState(initial.dniType || "DNI");
  const [dniNumber, setDniNumber] = useState(initial.dniNumber || initial.dni || "");
  const [cuil, setCuil] = useState(initial.cuil || "");

  const [dniFrontPath, setDniFrontPath] = useState(initial.dniFrontPath || "");
  const [dniBackPath, setDniBackPath] = useState(initial.dniBackPath || "");

  const [dniFrontFile, setDniFrontFile] = useState<File | null>(null);
  const [dniBackFile, setDniBackFile] = useState<File | null>(null);

  const [acceptReal, setAcceptReal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const missing = useMemo(
    () =>
      missingFields({
        firstName,
        lastName,
        street,
        streetNumber,
        locality,
        city,
        province,
        country,
        postalCode,
        mobile,
        dniType,
        dniNumber,
        cuil,
        dniFrontPath,
        dniBackPath,
      }),
    [
      firstName,
      lastName,
      street,
      streetNumber,
      locality,
      city,
      province,
      country,
      postalCode,
      mobile,
      dniType,
      dniNumber,
      cuil,
      dniFrontPath,
      dniBackPath,
    ]
  );

  async function onSave() {
    setError(null);
    setOk(null);

    if (!firstName.trim() || !lastName.trim() || !mobile.trim() || !dniType.trim() || !onlyDigits(dniNumber)) {
      setError("Completá los campos obligatorios (*) antes de guardar.");
      return;
    }

    if (!acceptReal) {
      setError("Confirmá que los datos son reales y verificables.");
      return;
    }

    setBusy(true);
    try {
      // 1) Subir DNI (opcional)
      if (dniFrontFile) {
        const r = await uploadIdDoc("front", dniFrontFile);
        setDniFrontPath(r.path);
      }
      if (dniBackFile) {
        const r = await uploadIdDoc("back", dniBackFile);
        setDniBackPath(r.path);
      }

      // 2) Persistir perfil (legacy + extendido)
      const fullName = joinName(firstName, middleName, lastName);
      const address = buildAddress({ street, streetNumber, locality, city, province, country, postalCode }) || (initial.address || "");

      const payload = {
        fullName,
        dni: onlyDigits(dniNumber),
        cuil: onlyDigits(cuil),
        address: address || "-",
        phone: mobile,

        firstName,
        middleName,
        lastName,
        street,
        streetNumber,
        locality,
        city,
        province,
        country,
        postalCode,
        dniType,
        dniNumber: onlyDigits(dniNumber),
        dniFrontPath: dniFrontPath || undefined,
        dniBackPath: dniBackPath || undefined,
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "No se pudo guardar el perfil");
        return;
      }

      setOk("Guardado. ¡Listo!");
      window.location.href = next;
    } catch (e: any) {
      setError(e?.message || "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold">Importante: usá datos reales y verificables</div>
        <p className="mt-2 leading-relaxed">
          Estos datos pueden quedar asentados en el proceso de firma y en el registro de auditoría del documento. Si la información no es real,
          podés tener problemas para acreditar identidad o resolver conflictos.
        </p>
      </div>

      {missing.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
          <div className="font-semibold text-zinc-900">Te falta completar</div>
          <p className="mt-1 text-zinc-600">Podés guardar con lo obligatorio, pero mientras más completo esté tu perfil, mejor.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {missing.slice(0, 12).map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Label htmlFor="first">Nombre *</Label>
              <Input id="first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ej: Juan" />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="middle">Segundo nombre</Label>
              <Input id="middle" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="last">Apellido *</Label>
              <Input id="last" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Ej: Pérez" />
            </div>
          </div>

          <div>
            <Label>Email</Label>
            <Input value={initial.email} readOnly className="bg-zinc-50" />
            <p className="mt-2 text-xs text-zinc-500">El email se valida por sesión (Magic Link). Es el identificador de acceso.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="mobile">Teléfono móvil *</Label>
              <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Ej: +54 11 5555-5555" />
            </div>
            <div>
              <Label htmlFor="cuil">CUIT/CUIL (sin puntos, sin guiones)</Label>
              <Input id="cuil" value={cuil} onChange={(e) => setCuil(e.target.value)} inputMode="numeric" placeholder="Ej: 20123456789" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Documento de identidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="dniType">Tipo DNI *</Label>
              <Input id="dniType" value={dniType} onChange={(e) => setDniType(e.target.value)} placeholder="DNI" />
            </div>
            <div>
              <Label htmlFor="dniNumber">DNI número * (sin puntos)</Label>
              <Input id="dniNumber" value={dniNumber} onChange={(e) => setDniNumber(e.target.value)} inputMode="numeric" placeholder="Ej: 12345678" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>DNI Frente (recomendado)</Label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setDniFrontFile(e.target.files?.[0] || null)}
              />
              <p className="mt-2 text-xs text-zinc-500">
                Estado: <b className="text-zinc-900">{dniFrontPath ? "Cargado" : "No cargado"}</b>
              </p>
            </div>
            <div>
              <Label>DNI Dorso (recomendado)</Label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setDniBackFile(e.target.files?.[0] || null)}
              />
              <p className="mt-2 text-xs text-zinc-500">
                Estado: <b className="text-zinc-900">{dniBackPath ? "Cargado" : "No cargado"}</b>
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-600">
            La imagen del DNI es opcional pero recomendada. Sirve para dar mayor veracidad a tu identidad y facilitar validaciones internas.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Domicilio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="street">Calle</Label>
              <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Ej: Av. Siempre Viva" />
            </div>
            <div>
              <Label htmlFor="streetNumber">Altura</Label>
              <Input id="streetNumber" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} placeholder="Ej: 742" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="locality">Localidad</Label>
              <Input id="locality" value={locality} onChange={(e) => setLocality(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" value={province} onChange={(e) => setProvince(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="country">País</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="postal">Código Postal</Label>
              <Input id="postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
            <div>
              <Label>Dirección (vista previa)</Label>
              <Input
                value={buildAddress({ street, streetNumber, locality, city, province, country, postalCode })}
                readOnly
                className="bg-zinc-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={acceptReal}
            onChange={(e) => setAcceptReal(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-zinc-300"
          />
          <span>
            Confirmo que los datos cargados son <b className="text-zinc-900">reales, actuales y verificables</b>. Entiendo que pueden usarse en el
            proceso de firma y auditoría.
          </span>
        </label>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</div>}
      {ok && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{ok}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-600">
          Tu plan se gestiona en <Link href="/dashboard/account" className="font-medium text-emerald-700 hover:underline">Cuentas</Link>.
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => (window.location.href = next)} disabled={busy}>
            Volver
          </Button>
          <Button onClick={onSave} disabled={busy}>
            {busy ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="pt-2 text-xs text-zinc-500">
        <p>
          Al continuar, aceptás que este servicio utiliza Firma Electrónica Simple (Ley 25.506 art. 5). No es firma digital certificada.
        </p>
      </div>
    </div>
  );
}
