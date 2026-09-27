import Link from "next/link";

// Terms of service (linked from Google's OAuth consent screen).
export const metadata = { title: "Condicions del servei · Clotparcament" };

export default function Condicions() {
  return (
    <main className="text">
      <h1>Condicions del servei</h1>
      <p>
        Clotparcament és una eina privada, gratuïta i sense ànim de lucre per a un grup d'amics
        convidats. Fent-la servir acceptes aquestes condicions.
      </p>

      <h2>Accés</h2>
      <p>
        Només hi poden entrar les persones convidades per un administrador del grup. L'administrador
        pot retirar l'accés en qualsevol moment.
      </p>

      <h2>Ús</h2>
      <ul>
        <li>Prem els botons només quan realment hagis aparcat o no hagis trobat lloc.</li>
        <li>No facis servir l'aplicació mentre condueixes.</li>
        <li>Respecta sempre les normes de circulació i d'aparcament.</li>
      </ul>

      <h2>Sense garanties</h2>
      <p>
        Les recomanacions es basen en l'experiència del grup i són orientatives. No garantim que hi
        hagi lloc per aparcar ni que el servei estigui sempre disponible.
      </p>

      <h2>Dades</h2>
      <p>
        Consulta la <Link href="/privacitat/">política de privacitat</Link>.
      </p>

      <p>
        <Link href="/">← Torna a l'aplicació</Link>
      </p>
    </main>
  );
}
