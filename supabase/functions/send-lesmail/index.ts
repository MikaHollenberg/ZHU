// Edge Function: send-lesmail
//
// Verstuurt een e-mail naar de cursist of instructeur zodra de beheerder een
// les inplant, verzet, annuleert, of een instructeur-aanvraag goedkeurt.
// Wordt vanuit de frontend aangeroepen via supabase.functions.invoke() met
// de ingelogde beheerder-sessie — dus altijd na een geslaagde RPC-aanroep,
// nooit als vervanging daarvoor. Een mislukte mail mag de les-actie zelf
// nooit blokkeren (zie src/lib/notificaties.ts, dat deze function altijd
// in een try/catch aanroept).
//
// Vereiste secrets (Project Settings -> Edge Functions -> Secrets):
//   RESEND_API_KEY   - API-key van resend.com
//   EMAIL_FROM       - bijv. "Zeilschool Het Uitgeestermeer <noreply@zeilschooluitgeest.nl>"
//                       (vereist een geverifieerd domein bij Resend; zonder
//                       secret valt dit terug op Resend se test-adres)
// SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY staan al standaard klaar voor
// elke Edge Function, die hoef je niet zelf te zetten.

import { createClient } from 'jsr:@supabase/supabase-js@2'

type Event = 'les_ingepland' | 'les_verzet' | 'les_geannuleerd' | 'aanvraag_goedgekeurd'

const DISCIPLINE_LABELS: Record<string, string> = {
  polyvalk: 'Polyvalk',
  fox22: 'Fox22',
  windsurf: 'Windsurf',
}

const DUO_CURSUS_TYPE_LABELS: Record<string, string> = {
  vijf_keer_twee_uur: '5x2 uur',
  twee_daagse: '2-daagse cursus',
}

function formatDatum(datum: string) {
  return new Date(`${datum}T00:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTijd(tijd: string) {
  return tijd.slice(0, 5)
}

function lesOmschrijving(les: {
  discipline: string
  soort: string
  duo_cursus_type: string | null
}) {
  const discipline = DISCIPLINE_LABELS[les.discipline] ?? les.discipline
  if (les.soort !== 'duo_cursus') return discipline
  const vorm = les.duo_cursus_type ? ` (${DUO_CURSUS_TYPE_LABELS[les.duo_cursus_type] ?? les.duo_cursus_type})` : ''
  return `${discipline} · duo-cursus${vorm}`
}

function layout(titel: string, inhoudHtml: string) {
  return `<!doctype html>
<html lang="nl">
  <body style="margin:0;padding:24px;background:#f3f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
      <tr>
        <td style="padding-bottom:20px;font-size:16px;font-weight:700;color:#1f6d99;">
          ⛵ Zeilschool Het Uitgeestermeer
        </td>
      </tr>
      <tr>
        <td style="background:#ffffff;border-radius:16px;padding:28px;box-shadow:0 1px 2px rgba(15,55,77,.05),0 6px 16px rgba(15,55,77,.07);">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#1f6d99;">${titel}</h1>
          <div style="font-size:15px;line-height:1.6;color:#334155;">${inhoudHtml}</div>
        </td>
      </tr>
      <tr>
        <td style="padding-top:20px;font-size:12px;line-height:1.5;color:#94a3b8;">
          Vragen? Mail ons gerust op
          <a href="mailto:info@zeilschooluitgeest.nl" style="color:#1f6d99;">info@zeilschooluitgeest.nl</a>.
        </td>
      </tr>
    </table>
  </body>
</html>`
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Alleen POST toegestaan' }), { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Niet ingelogd' }), { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const emailFrom = Deno.env.get('EMAIL_FROM') ?? 'Zeilschool Het Uitgeestermeer <onboarding@resend.dev>'

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // Alleen ingelogde beheerders mogen deze function aanroepen — zelfde regel
  // als de plan_les/verzet_les/annuleer_les-RPC's zelf.
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Niet ingelogd' }), { status: 401 })
  }

  const { data: callerProfile } = await admin.from('profiles').select('rol').eq('id', user.id).single()
  if (callerProfile?.rol !== 'beheerder') {
    return new Response(JSON.stringify({ error: 'Alleen de beheerder mag mails versturen' }), { status: 403 })
  }

  let payload: { event?: Event; les_id?: string }
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Ongeldige aanvraag' }), { status: 400 })
  }

  const { event, les_id } = payload
  if (!event || !les_id) {
    return new Response(JSON.stringify({ error: 'event en les_id zijn verplicht' }), { status: 400 })
  }

  const { data: les, error: lesError } = await admin.from('lessen').select('*').eq('id', les_id).single()
  if (lesError || !les) {
    return new Response(JSON.stringify({ error: 'Les niet gevonden' }), { status: 404 })
  }

  let to: string | null = null
  let voornaam = ''
  let subject = ''
  let html = ''

  if (event === 'les_ingepland' || event === 'les_verzet' || event === 'les_geannuleerd') {
    const { data: cursist } = await admin
      .from('profiles')
      .select('voornaam, email')
      .eq('id', les.cursist_id)
      .single()
    if (!cursist) {
      return new Response(JSON.stringify({ error: 'Cursist niet gevonden' }), { status: 404 })
    }
    to = cursist.email
    voornaam = cursist.voornaam

    if (event === 'les_ingepland') {
      subject = `Je les staat ingepland — ${formatDatum(les.datum)}`
      html = layout(
        'Je les staat ingepland! 🎉',
        `<p>Hoi ${voornaam},</p>
         <p>Er staat een les voor je ingepland:</p>
         <p style="margin:16px 0;padding:14px 16px;background:#f1f5f9;border-radius:12px;">
           <strong>${formatDatum(les.datum)}</strong><br>
           ${formatTijd(les.starttijd)} – ${formatTijd(les.eindtijd)} uur<br>
           ${lesOmschrijving(les)}
         </p>
         <p>Je vindt deze les ook terug onder "Mijn lessen" in het portal. Tot dan!</p>`,
      )
    } else if (event === 'les_verzet') {
      let oud: { datum: string; starttijd: string; eindtijd: string } | null = null
      if (les.oorspronkelijke_les_id) {
        const { data: oudeLes } = await admin
          .from('lessen')
          .select('datum, starttijd, eindtijd')
          .eq('id', les.oorspronkelijke_les_id)
          .single()
        oud = oudeLes
      }
      let reden = ''
      if (les.label_id) {
        const { data: label } = await admin.from('labels').select('naam').eq('id', les.label_id).single()
        reden = label?.naam ?? ''
      }
      subject = `Je les is verzet naar ${formatDatum(les.datum)}`
      html = layout(
        'Je les is verzet',
        `<p>Hoi ${voornaam},</p>
         ${
           oud
             ? `<p>Je les van <strong>${formatDatum(oud.datum)}, ${formatTijd(oud.starttijd)}–${formatTijd(oud.eindtijd)} uur</strong> is verzet naar:</p>`
             : `<p>Je les is verzet naar:</p>`
         }
         <p style="margin:16px 0;padding:14px 16px;background:#f1f5f9;border-radius:12px;">
           <strong>${formatDatum(les.datum)}</strong><br>
           ${formatTijd(les.starttijd)} – ${formatTijd(les.eindtijd)} uur<br>
           ${lesOmschrijving(les)}
         </p>
         ${reden ? `<p>Reden: ${reden}</p>` : ''}
         <p>Kom je er niet uit of heb je vragen? Neem gerust contact met ons op.</p>`,
      )
    } else {
      let reden = ''
      if (les.label_id) {
        const { data: label } = await admin.from('labels').select('naam').eq('id', les.label_id).single()
        reden = label?.naam ?? ''
      }
      subject = `Je les op ${formatDatum(les.datum)} is geannuleerd`
      html = layout(
        'Je les is geannuleerd',
        `<p>Hoi ${voornaam},</p>
         <p>Je les op <strong>${formatDatum(les.datum)}, ${formatTijd(les.starttijd)}–${formatTijd(les.eindtijd)} uur</strong> is geannuleerd.</p>
         ${reden ? `<p>Reden: ${reden}</p>` : ''}
         <p>Wil je een nieuwe afspraak inplannen? Geef je beschikbaarheid opnieuw door in het portal, of neem contact met ons op.</p>`,
      )
    }
  } else if (event === 'aanvraag_goedgekeurd') {
    if (!les.instructeur_id) {
      return new Response(JSON.stringify({ error: 'Geen instructeur gekoppeld aan deze les' }), { status: 400 })
    }
    const { data: instructeur } = await admin
      .from('profiles')
      .select('voornaam, email')
      .eq('id', les.instructeur_id)
      .single()
    if (!instructeur) {
      return new Response(JSON.stringify({ error: 'Instructeur niet gevonden' }), { status: 404 })
    }
    to = instructeur.email
    voornaam = instructeur.voornaam
    subject = `Je aanmelding voor ${formatDatum(les.datum)} is goedgekeurd`
    html = layout(
      'Je aanmelding is goedgekeurd ✓',
      `<p>Hoi ${voornaam},</p>
       <p>Je aanmelding als instructeur is goedgekeurd voor:</p>
       <p style="margin:16px 0;padding:14px 16px;background:#f1f5f9;border-radius:12px;">
         <strong>${formatDatum(les.datum)}</strong><br>
         ${formatTijd(les.starttijd)} – ${formatTijd(les.eindtijd)} uur<br>
         ${lesOmschrijving(les)}
       </p>
       <p>Je vindt deze les terug bij "Lesgeven" in het portal.</p>`,
    )
  } else {
    return new Response(JSON.stringify({ error: `Onbekend event: ${event}` }), { status: 400 })
  }

  if (!to) {
    return new Response(JSON.stringify({ error: 'Geen e-mailadres gevonden' }), { status: 404 })
  }

  if (!resendApiKey) {
    // Nog geen e-maildienst gekoppeld — de les-actie zelf is al gelukt, dus
    // we falen hier stil i.p.v. een foutmelding aan de beheerder te tonen.
    return new Response(JSON.stringify({ skipped: true, reason: 'RESEND_API_KEY ontbreekt' }), { status: 200 })
  }

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: emailFrom, to: [to], subject, html }),
  })

  if (!resendRes.ok) {
    const detail = await resendRes.text()
    return new Response(JSON.stringify({ error: 'Versturen via Resend is mislukt', detail }), { status: 502 })
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
