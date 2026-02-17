// web/app/help/page.tsx

export const metadata = {
  title: 'Help & info – Custom Cocktails',
};

type Section = {
  id: string;
  title: string;
};

const sections: Section[] = [
  { id: 'about', title: 'What is Custom Cocktails?' },
  { id: 'how-to-order', title: 'How do I order?' },
  { id: 'recipes', title: 'Your recipe & flavour' },
  { id: 'problems-refunds', title: 'Problems & refunds' },
  { id: 'allergies', title: 'Allergies & dietary needs' },
  { id: 'contact', title: 'Contact us' },
  { id: 'bar-owners', title: 'For bar owners' },
];

export default function HelpPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:flex-row sm:gap-14 sm:px-6 lg:px-8">
      {/* Sidebar navigation (desktop) */}
      <aside className="sm:w-56 sm:shrink-0">
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Help & info
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Everything you need to know about using Custom Cocktails in-bar.
          </p>
        </div>

        <nav className="hidden space-y-1 text-sm sm:block">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="block rounded-md px-3 py-2 text-muted-foreground hover:bg-card/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <section className="flex-1 space-y-12 pb-16">
        {/* Mobile nav */}
        <nav className="flex gap-2 overflow-x-auto pb-2 text-xs sm:hidden">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="whitespace-nowrap rounded-full border border-border/60 px-3 py-1 text-muted-foreground hover:bg-card/80 hover:text-foreground"
            >
              {section.title}
            </a>
          ))}
        </nav>

        {/* About / overview */}
        <section id="about" className="scroll-mt-24 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            What is Custom Cocktails?
          </h2>
          <p className="text-sm text-muted-foreground">
            Custom Cocktails is a bespoke cocktail creation tool that helps your bar
            team design one-off drinks based on your answers to a short quiz. You
            tell us what you like; we generate a tailored recipe and method that
            your bartender can mix fresh for you.
          </p>
          <p className="text-sm text-muted-foreground">
            Behind the scenes, our system blends flavour data, spirits knowledge and
            bartender-level recipe building. It balances base spirit, modifiers,
            sweetness, acidity and dilution to build a drink that should be both
            interesting and genuinely drinkable – not just a random mix.
          </p>
          <p className="text-sm text-muted-foreground">
            Custom Cocktails has been in development for over three years and has
            generated hundreds of unique cocktails, with more than 250 custom drinks
            sold across the UK so far. Bars use it to add a bit of theatre and
            personalisation to their menu, while you get something that feels like
            it was designed just for you.
          </p>
        </section>

        {/* How to order / basic flow */}
        <section id="how-to-order" className="scroll-mt-24 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            How do I order my Custom Cocktail?
          </h2>

          <p className="text-sm text-muted-foreground">
            Custom Cocktails is not an automated ordering system – it helps create
            your drink, but the bar team still make and serve it in the usual way.
          </p>

          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Answer the questions in the quiz and submit your choices.</li>
            <li>
              At the end, you'll see your personalised recipe card (or a summary
              screen) with the name of your drink and how it's made.
            </li>
            <li>
              Go to the bar and let the team know you'd like to order a{' '}
              <span className="font-medium">Custom Cocktail</span>.
            </li>
            <li>
              Give them your name (and, if asked, show them your recipe on your
              phone) so they can pull up your ticket on their system.
            </li>
          </ol>

          <p className="text-sm text-muted-foreground">
            Once they've confirmed your order, the bar team will mix and serve your
            Custom Cocktail just like any other drink – normal wait times and
            service rules apply.
          </p>
        </section>

        {/* Recipe visibility & flavour confidence */}
        <section id="recipes" className="scroll-mt-24 space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">
              When do I see my full recipe and method?
            </h2>
            <p className="text-sm text-muted-foreground">
              You'll see a summary of your drink at the end of the quiz. Depending
              on how your bar has set things up, you may:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>See the full recipe and method immediately, or</li>
              <li>See a simplified view in-bar and receive the full details later by email.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              If you need to double-check ingredients or method, just ask the bar
              staff – they'll be able to see the full spec on their system.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">
              My recipe looks a bit strange – will it actually taste good?
            </h2>
            <p className="text-sm text-muted-foreground">
              Some of the best cocktails look unexpected on paper. Our recipe engine
              is designed to keep drinks balanced and bar-friendly, even when your
              choices are a bit wild.
            </p>
            <p className="text-sm text-muted-foreground">
              We work closely with each venue to make sure ingredients are practical
              for their bar, and we regularly review highly rated and low-rated
              drinks to improve future recipes. If something ever feels off, speak
              to the bar team – most tweaks can be made on the spot.
            </p>
          </div>
        </section>

        {/* Problems & refunds */}
        <section id="problems-refunds" className="scroll-mt-24 space-y-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Problems & refunds
          </h2>

          <div className="space-y-3">
            <h3 className="text-base font-semibold tracking-tight">
              If your drink hasn&apos;t arrived
            </h3>
            <p className="text-sm text-muted-foreground">
              Your Custom Cocktail is mixed and served by the bar team, just like
              any other drink ordered at the bar.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Go to the bar and confirm they have your Custom Cocktail under your name.</li>
              <li>
                Show your confirmation screen or recipe so they can find your ticket
                quickly in their system.
              </li>
              <li>
                If they still can&apos;t see an order, ask them to double-check their till
                or ordering system, then contact us with your order details so we
                can investigate.
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold tracking-tight">
              If something is wrong with the drink
            </h3>
            <p className="text-sm text-muted-foreground">
              This could be the wrong drink entirely, a missing or different
              garnish, a different glass from the recipe card, or a drink that just
              doesn&apos;t taste quite right to you.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Speak to the bar staff as soon as possible and explain what feels
                wrong about the drink.
              </li>
              <li>
                Give them the chance to repair, replace or adjust the drink to your
                taste – most issues can be fixed immediately.
              </li>
              <li>
                If you&apos;re still unhappy after they&apos;ve tried to fix it, email us at{' '}
                <a
                  href="mailto:info@custom-cocktails.co.uk"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  info@custom-cocktails.co.uk
                </a>{' '}
                with:
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>Your name</li>
                  <li>Order ID or approximate time of order</li>
                  <li>Bar name and location</li>
                  <li>A short description of what went wrong</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold tracking-tight">
              If you&apos;ve been charged but there&apos;s no order at the bar
            </h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Show the bar your email receipt or payment confirmation so they can
                double-check their system.
              </li>
              <li>
                If there&apos;s still no record of the order, please{' '}
                <span className="font-medium">do not</span> place a second order in
                the app just to be safe.
              </li>
              <li>
                Instead, email us at{' '}
                <a
                  href="mailto:info@custom-cocktails.co.uk"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  info@custom-cocktails.co.uk
                </a>{' '}
                with your order ID, bar name and the approximate time of purchase.
                We&apos;ll work with the bar and our payment provider to confirm what
                happened and arrange a refund or other resolution where appropriate.
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold tracking-tight">
              Refunds & service review
            </h3>
            <p className="text-sm text-muted-foreground">
              If there&apos;s a problem with the Custom Cocktails service itself – for
              example, the recipe generation clearly fails, the app behaves
              unexpectedly or you receive a drink that doesn&apos;t reasonably match the
              recipe we provided – we&apos;ll review this and, where appropriate, we&apos;ll
              cover a refund or credit for the Custom Cocktails part of the
              experience.
            </p>
            <p className="text-sm text-muted-foreground">
              We also keep an eye on feedback. Any drink rated under{' '}
              <span className="font-medium">5 stars</span> in your follow-up email is
              included in our weekly admin review. Low ratings don&apos;t guarantee a
              refund, but they do flag recipes or venues that may need attention so
              we can keep improving the service.
            </p>
            <p className="text-sm text-muted-foreground">
              If your concern is about fulfilment – for example, a long wait at the
              bar, a dropped glass, service issues or anything else that happens
              while the drink is being made or served – this will be handled under
              the bar&apos;s own policies. The quickest way to get help is to speak to
              the venue team directly on the night.
            </p>
            <p className="text-sm text-muted-foreground">
              Whatever has gone wrong, you won&apos;t be left on your own. Talk to the
              bar team first for anything service-related, then contact us if you
              believe there&apos;s been a problem with the app, recipe, or overall
              Custom Cocktails experience.
            </p>
          </div>
        </section>

        {/* Allergies */}
        <section id="allergies" className="scroll-mt-24 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Allergies & dietary needs
          </h2>
          <p className="text-sm text-muted-foreground">
            The Custom Cocktails quiz includes questions about allergies and
            ingredients you&apos;d like to avoid, and we pass that information to the bar
            with your recipe. However, only the bar team can confirm how your drink
            is prepared in their venue.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Always tell the bar team about any allergies or intolerances{' '}
              <span className="font-medium">before</span> they make your drink.
            </li>
            <li>
              If you&apos;re unsure whether an ingredient is suitable, ask the bar team
              to check before you order.
            </li>
            <li>
              If you have a severe allergy, follow your normal precautions (for
              example, avoiding high-risk ingredients or shared equipment).
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Custom Cocktails can help highlight preferences and potential risks, but
            it doesn&apos;t replace speaking directly to staff about your specific needs.
          </p>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-24 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Contact us</h2>
          <p className="text-sm text-muted-foreground">
            Need help with an order, have feedback on a drink, or want to share an
            idea? Drop us a line and the team will get back to you as soon as they
            can.
          </p>
          <p className="text-sm text-muted-foreground">
            Email:{' '}
            <a
              href="mailto:info@custom-cocktails.co.uk"
              className="font-medium text-primary underline underline-offset-2"
            >
              info@custom-cocktails.co.uk
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            When you email, please include your name, the bar you visited, the
            approximate date and time, and any relevant order details. It helps us
            sort things out much faster.
          </p>
        </section>

        {/* Bar owners */}
        <section id="bar-owners" className="scroll-mt-24 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">For bar owners</h2>
          <p className="text-sm text-muted-foreground">
            Interested in offering Custom Cocktails in your venue? We&apos;d love to
            talk. The platform is designed to fit into your existing service flow,
            using your current back bar and staff – no extra hardware needed.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Flexible setup to match your menu, stock and house serves.</li>
            <li>Staff-friendly recipes with clear specs and simple steps.</li>
            <li>Optional reporting to see how guests are rating their drinks.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            To chat about running Custom Cocktails in your bar, email us at{' '}
            <a
              href="mailto:info@custom-cocktails.co.uk"
              className="font-medium text-primary underline underline-offset-2"
            >
              info@custom-cocktails.co.uk
            </a>{' '}
            with your venue name and a contact number. We&apos;ll follow up with more
            details and next steps.
          </p>
        </section>
      </section>
    </main>
  );
}
