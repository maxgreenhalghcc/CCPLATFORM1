/**
 * Renders the Ingredients admin page UI for managing the master ingredient library.
 *
 * Displays a header with page title and description and a bordered content card as a placeholder
 * for the ingredient management interface (to be connected to admin metrics and CRUD endpoints).
 *
 * @returns The JSX element for the Ingredients admin page.
 */
export default function AdminIngredientsPage() {
  return (
    <div className="space-y-6 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Ingredients</h1>
        <p className="text-sm text-muted-foreground">
          Maintain the master ingredient library. Configure allergen flags and default availability.
        </p>
      </header>
      <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Ingredient management UI placeholder. Connect to `/v1/admin/metrics/ingredients` and future CRUD endpoints.
      </p>
    </div>
  );
}