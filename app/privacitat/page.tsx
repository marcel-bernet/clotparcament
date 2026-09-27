import Link from "next/link";

// Privacy policy (required by Google for "Sign in with Google").
export const metadata = { title: "Privacitat · Clotparcament" };

export default function Privacitat() {
  return (
    <main className="text">
      <h1>Privacitat</h1>
      <p>
        Clotparcament és una aplicació privada i sense ànim de lucre per a un grup d'amics, per
        compartir on es troba aparcament al barri del Clot (Barcelona).
      </p>

      <h2>Quines dades guardem</h2>
      <ul>
        <li>El teu nom i correu electrònic del compte de Google, per saber qui ets quan entres.</li>
        <li>
          La ubicació GPS i l'hora, <strong>només</strong> en el moment que prems «He aparcat aquí» o
          «Aquí no hi ha lloc». L'aplicació no fa cap seguiment de la ubicació en segon pla.
        </li>
      </ul>

      <h2>Per a què</h2>
      <p>
        Només per recomanar als membres del grup on és més fàcil aparcar. No hi ha publicitat, no es
        venen dades i no es comparteixen amb ningú de fora del grup.
      </p>

      <h2>Qui hi té accés</h2>
      <p>
        Només els membres convidats del grup. Les dades es guarden a Supabase (servidors a la Unió
        Europea). L'inici de sessió es fa amb Google i la web s'allotja a GitHub Pages.
      </p>

      <h2>Esborrar les teves dades</h2>
      <p>
        Pots demanar a l'administrador del grup que t'esborri el compte i totes les teves dades en
        qualsevol moment.
      </p>

      <p>
        <Link href="/">← Torna a l'aplicació</Link>
      </p>
    </main>
  );
}
