# Create Tour Flow

Diese Datei beschreibt den aktuellen `Create Tour`-Flow anhand eines konkreten Beispiels.

Beispielszenario:

- der User ist eingeloggt
- der User klickt auf `+ New Tour`
- der User fuellt `Details` aus
- der User geht auf `Summary`
- der User speichert die Tour
- der User landet auf `Done`
- falls der User den Flow zwischendurch verlassen will, greift ein Leave-Dialog

Der Fokus liegt dabei auf:

- `Reactive Forms`
- `signal` fuer den gemeinsamen Draft
- Feature-Flow-Guard fuer das gesamte `Create Tour`-Feature
- `canDeactivate` Leave-Guard
- Zusammenspiel von Guard, Dialog und Draft-/Flow-Reset

## Ausgangspunkt: User klickt auf `+ New Tour`

Der Einstieg passiert ueber Dashboard oder Tours. Die Buttons machen nicht nur Navigation, sondern starten den Flow bewusst.

Beispiel aus [dashboard-page.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/features/dashboard/pages/dashboard/dashboard-page.ts):

```ts
protected openNewTour(): void {
  this.createTourFlow.startFlow();
  void this.router.navigateByUrl('/tours/create/details');
}
```

Das ist wichtig, weil das gesamte `Create Tour`-Feature nicht direkt per URL betreten werden soll.

## Vor dem Wizard: Flow Guard fuer das gesamte Feature

Die drei Wizard-Schritte sind:

- `/tours/create/details`
- `/tours/create/summary`
- `/tours/create/done`

In [app.routes.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/app.routes.ts) sind sie so geschuetzt:

```ts
{
  path: 'tours/create/details',
  component: CreateTourDetailsPage,
  canActivate: [authGuard, createTourFlowGuard],
  canDeactivate: [pendingChangesGuard]
},
{
  path: 'tours/create/summary',
  component: CreateTourSummaryPage,
  canActivate: [authGuard, createTourFlowGuard],
  canDeactivate: [pendingChangesGuard]
},
{
  path: 'tours/create/done',
  component: CreateTourDonePage,
  canActivate: [authGuard, createTourFlowGuard]
}
```

### Rolle des `authGuard`

`authGuard` prueft nur:

- ist der User eingeloggt?

Wenn nicht, geht es zu `/login`.

### Rolle des `createTourFlowGuard`

`createTourFlowGuard` prueft:

- wurde der Wizard offiziell ueber `+ New Tour` gestartet?

Das passiert ueber den Service [create-tour-flow.service.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/features/tours/services/create-tour-flow.service.ts):

```ts
@Injectable({ providedIn: 'root' })
export class CreateTourFlowService {
  readonly canAccessFlow = signal(false);

  startFlow(): void {
    this.canAccessFlow.set(true);
  }

  resetFlow(): void {
    this.canAccessFlow.set(false);
  }
}
```

Und im Guard [create-tour-flow.guard.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/core/guards/create-tour-flow.guard.ts):

```ts
export const createTourFlowGuard: CanActivateFn = () => {
  const flowService = inject(CreateTourFlowService);
  const router = inject(Router);

  if (flowService.canAccessFlow()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
```

Das bedeutet:

- eingeloggt, aber kein offizieller Flow-Start => `Dashboard`
- nicht eingeloggt => schon vorher durch `authGuard` nach `Login`

## Schritt 1: Die Details-Seite wird geoeffnet

Der User landet auf `CreateTourDetailsPage` in [create-tour-details-page.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/features/tours/pages/create-tour/create-tour-details-page.ts).

Beim Laden passieren zwei Dinge:

1. die Seite scrollt nach oben
2. das Formular wird aus dem aktuellen Draft vorbelegt

```ts
constructor() {
  const draft = this.draftService.draft();
  this.draftService.setSaveResult(null);

  this.detailsForm = this.formBuilder.nonNullable.group({
    name: [draft.name, [Validators.required]],
    transportType: [draft.transportType, [Validators.required]],
    from: [draft.from, [Validators.required]],
    to: [draft.to, [Validators.required]],
    description: [
      draft.description,
      [Validators.required, Validators.maxLength(this.maxDescriptionLength)]
    ]
  });

  afterNextRender(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  });
}
```

### Warum hier `Reactive Forms`?

Die Details-Seite ist die echte Eingabeseite. Deshalb ist `Reactive Forms` hier die richtige Quelle fuer:

- Pflichtfelder
- `maxlength`
- Touched-/Invalid-State
- spaetere Submit-Validierung

Im Template [create-tour-details-page.html](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/features/tours/pages/create-tour/create-tour-details-page.html) ist das Formular direkt gebunden:

```html
<form [formGroup]="detailsForm" class="create-tour-form">
  <input type="text" formControlName="name" />
  <select formControlName="transportType">...</select>
  <input type="text" formControlName="from" />
  <input type="text" formControlName="to" />
  <textarea formControlName="description"></textarea>
</form>
```

## Schritt 2: Wo liegen die Daten zwischen `Details` und `Summary`?

Der gemeinsam genutzte Zwischenstand liegt im signal-basierten Draft-Service [create-tour-draft.service.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/features/tours/services/create-tour-draft.service.ts).

```ts
export interface CreateTourDraft {
  name: string;
  transportType: string;
  from: string;
  to: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class CreateTourDraftService {
  readonly draft = signal<CreateTourDraft>(INITIAL_DRAFT);
  readonly saveResult = signal<CreateTourSaveResult | null>(null);

  update(draft: CreateTourDraft): void {
    this.draft.set(draft);
  }

  reset(): void {
    this.draft.set(INITIAL_DRAFT);
  }

  setSaveResult(result: CreateTourSaveResult | null): void {
    this.saveResult.set(result);
  }
}
```

### Warum `signal` hier sinnvoll ist

Der Draft ist nicht das Formular selbst, sondern der seitenuebergreifende Wizard-Zustand.

`signal` ist hier praktisch, weil:

- `Details` Werte hineinschreiben kann
- `Summary` die Werte read-only lesen kann
- `Edit` denselben Zwischenstand wieder zurueckbringt
- Leave und Done den Zustand sauber resetten koennen

Kurz:

- Eingabe = `Reactive Forms`
- Wizard-Zwischenstand = `signal`

## Schritt 3: Der User fuellt `Details` aus

Beispielwerte:

- `name = Vienna City Center Tour`
- `transportType = Car`
- `from = Stephansdom, 1010 Vienna`
- `to = Schloss Schoenbrunn, 1130 Vienna`
- `description = ...`

Diese Werte liegen zunaechst im `Reactive Form`.

Der Description-Counter liest direkt aus dem Formular:

```ts
protected get descriptionLength(): number {
  return this.detailsForm.controls.description.value.length;
}
```

Pflichtfelder werden ueber den Formzustand markiert:

```ts
protected showRequiredError(
  controlName: 'name' | 'transportType' | 'from' | 'to' | 'description'
): boolean {
  const control = this.detailsForm.controls[controlName];

  return control.touched && control.hasError('required');
}
```

## Schritt 4: Der User klickt auf `Go to summary`

Die Methode `goToSummary()`:

```ts
protected goToSummary(): void {
  this.detailsForm.markAllAsTouched();

  if (this.detailsForm.invalid) {
    return;
  }

  this.draftService.update(this.detailsForm.getRawValue());
  this.allowRouteChange = true;
  void this.router.navigateByUrl('/tours/create/summary');
}
```

### Reihenfolge

1. alle Felder werden als touched markiert
2. invalides Formular blockiert den Wechsel
3. bei Erfolg werden die Werte ins `signal` geschrieben
4. der interne Wizard-Wechsel wird ueber `allowRouteChange` freigegeben
5. danach geht es auf `Summary`

## Schritt 5: Warum der Leave-Guard den internen Wechsel nicht blockiert

`Details` und `Summary` haben beide `canDeactivate`.

Die Kernlogik:

```ts
canDeactivate(): boolean | Promise<boolean> {
  if (this.allowRouteChange) {
    this.allowRouteChange = false;
    return true;
  }

  if (this.pendingLeaveResolver) {
    return false;
  }

  this.showLeaveDialog = true;

  return new Promise<boolean>((resolve) => {
    this.pendingLeaveResolver = resolve;
  });
}
```

Das bedeutet:

- `Details -> Summary` und `Summary -> Details` sind interne Wizard-Wechsel
- dafuer wird `allowRouteChange` auf `true` gesetzt
- deshalb erscheint dabei kein Leave-Popup

## Schritt 6: Die Summary-Seite liest die Werte aus dem Draft

Auf `/tours/create/summary` landet der User in [create-tour-summary-page.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/features/tours/pages/create-tour-summary/create-tour-summary-page.ts).

Auch hier kommt der Zustand aus dem Draft-Service:

```ts
protected readonly draftService = inject(CreateTourDraftService);

protected get draft() {
  return this.draftService.draft();
}
```

Im Template [create-tour-summary-page.html](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/features/tours/pages/create-tour-summary/create-tour-summary-page.html) werden die Werte read-only angezeigt:

```html
<input type="text" [value]="draft.name" readonly />
<input type="text" [value]="draft.transportType" readonly />
<input type="text" [value]="draft.from" readonly />
<input type="text" [value]="draft.to" readonly />
<textarea readonly>{{ draft.description }}</textarea>
```

## Schritt 7: Der User klickt auf `Edit`

Die Methode:

```ts
protected editTour(): void {
  this.allowRouteChange = true;
  void this.router.navigateByUrl('/tours/create/details');
}
```

Dadurch:

1. wird die Navigation als interner Wizard-Wechsel markiert
2. blockiert der Leave-Guard nicht
3. baut `Details` das Formular wieder aus dem Draft auf

## Schritt 8: Der User klickt auf `Save`

Jetzt geht der Flow in den API-Teil ueber.

Die Save-Logik in [create-tour-summary-page.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/features/tours/pages/create-tour-summary/create-tour-summary-page.ts):

```ts
protected saveTour(): void {
  if (this.isSaving) {
    return;
  }

  this.isSaving = true;
  this.draftService.setSaveResult(null);

  this.tourApi
    .create({
      name: this.draft.name,
      description: this.draft.description,
      imagePath: '',
      transportType: this.draft.transportType,
      startName: this.draft.from,
      endName: this.draft.to
    })
    .pipe(finalize(() => (this.isSaving = false)))
    .subscribe({
      next: (tour) => {
        this.draftService.setSaveResult({
          status: 'success',
          title: 'Tour successfully created!',
          message: 'Your tour has been stored and is ready for the next steps.',
          tourId: tour.id
        });
        this.draftService.reset();
        this.allowRouteChange = true;
        void this.router.navigateByUrl('/tours/create/done');
      },
      error: () => {
        this.draftService.setSaveResult({
          status: 'error',
          title: 'Tour could not be created',
          message: 'Saving failed. Please review the data or try again.'
        });
        this.allowRouteChange = true;
        void this.router.navigateByUrl('/tours/create/done');
      }
    });
}
```

### Was hier passiert

1. `isSaving` verhindert Doppelklicks
2. die Summary-Werte werden auf das Backend-DTO gemappt
3. der API-Call laeuft ueber [tour-api.service.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/features/tours/services/tour-api.service.ts)
4. bei Erfolg wird ein Success-Ergebnis gespeichert
5. bei Fehler wird ein Error-Ergebnis gespeichert
6. danach geht es auf `Done`

## Schritt 9: Die Done-Seite zeigt Success oder Error

Die Done-Seite liegt in:

- [create-tour-done-page.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/features/tours/pages/create-tour-done/create-tour-done-page.ts)
- [create-tour-done-page.html](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/features/tours/pages/create-tour-done/create-tour-done-page.html)

Die Seite liest den Save-Ausgang ueber:

```ts
protected get result(): CreateTourSaveResult {
  return (
    this.draftService.saveResult() ?? {
      status: 'error',
      title: 'Tour could not be created',
      message: 'No save result is available for this flow.'
    }
  );
}
```

Damit zeigt `Done`:

- bei Erfolg eine Success-Darstellung mit `Go back to Dashboard` und `Go to tour`
- bei Fehler eine Error-Darstellung mit `Go back to Dashboard` und `Back to summary`

## Schritt 10: Wie der Flow nach `Done` sauber beendet wird

Beispiel aus [create-tour-done-page.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/features/tours/pages/create-tour-done/create-tour-done-page.ts):

```ts
protected goToDashboard(): void {
  this.flowService.resetFlow();
  this.draftService.setSaveResult(null);
  void this.router.navigateByUrl('/dashboard');
}
```

Das bedeutet:

1. der Create-Tour-Feature-Flow wird gesperrt
2. das Save-Ergebnis wird geloescht
3. der Wizard ist abgeschlossen

Bei erfolgreichem `Go to tour` wird der Flow ebenfalls beendet und zur Tourliste navigiert.

## Schritt 11: Was passiert, wenn der User den Flow ueber die Sidebar verlaesst?

Angenommen, der User ist auf `Summary` und klickt in der Sidebar auf `Dashboard`.

Dann greift der Leave-Guard aus [pending-changes.guard.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/core/guards/pending-changes.guard.ts):

```ts
export interface PendingChangesAware {
  canDeactivate: () => boolean | Promise<boolean>;
}

export const pendingChangesGuard: CanDeactivateFn<PendingChangesAware> = (
  component
) => component.canDeactivate();
```

Die Seite gibt in `canDeactivate()` ein `Promise<boolean>` zurueck. Angular pausiert die Navigation und zeigt den Dialog.

## Schritt 12: Wie der Dialog mit der Seite spricht

Die Shared Component liegt in:

- [confirm-dialog.ts](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/shared/components/confirm-dialog/confirm-dialog.ts)
- [confirm-dialog.html](/mnt/c/Users/wenha/Documents/FHTW/4.%20Semester/SWEN2/Tour/tour_planner/frontend/src/app/shared/components/confirm-dialog/confirm-dialog.html)

Outputs:

```ts
@Output() confirm = new EventEmitter<void>();
@Output() cancel = new EventEmitter<void>();
```

Im Wizard:

```html
<app-confirm-dialog
  [visible]="showLeaveDialog"
  (confirm)="confirmLeave()"
  (cancel)="stayOnPage()"
/>
```

Also:

- `Leave page` => `confirmLeave()`
- `Stay here` => `stayOnPage()`

## Schritt 13: User bestaetigt das Verlassen

Beispiel aus den Wizard-Seiten:

```ts
protected confirmLeave(): void {
  this.flowService.resetFlow();
  this.draftService.reset();
  this.showLeaveDialog = false;
  this.pendingLeaveResolver?.(true);
  this.pendingLeaveResolver = null;
}
```

### Reihenfolge

1. der Feature-Flow wird zurueckgesetzt
2. der Draft wird geloescht
3. der Dialog schliesst
4. das wartende Promise wird mit `true` aufgeloest
5. Angular setzt die bereits angefragte Navigation fort

Fachlich:

- der User verlaesst den Wizard wirklich
- der Zwischenstand soll verworfen werden
- ein neuer Direktzugriff auf `details/summary/done` ist danach wieder gesperrt

## Schritt 14: User bleibt doch im Flow

Wenn der User `Stay here` klickt:

```ts
protected stayOnPage(): void {
  this.showLeaveDialog = false;
  this.pendingLeaveResolver?.(false);
  this.pendingLeaveResolver = null;
}
```

Dann passiert:

1. Dialog schliesst
2. Promise wird mit `false` aufgeloest
3. Angular bricht die Navigation ab
4. die aktuelle Seite bleibt offen
5. Draft und Flow-State bleiben erhalten

## Gesamtbild in einem Satz

Der aktuelle `Create Tour`-Flow nutzt:

- `Reactive Forms` fuer die echte Eingabe auf `Details`
- ein `signal` als gemeinsamen Draft zwischen `Details`, `Summary` und `Done`
- einen zusaetzlichen Feature-Flow-Guard fuer kontrollierten Einstieg in den Wizard
- einen Leave-Guard mit bestaetigendem Dialog fuer externes Verlassen des Wizards
- `allowRouteChange`, damit interne Wizard-Navigation ohne Popup funktioniert

## Technische Kerngedanken

### Warum nicht alles nur mit Signals?

Weil `Details` eine echte Eingabeseite mit Validierung ist. Dafuer ist `Reactive Forms` sauberer.

### Warum nicht alles nur im FormGroup?

Weil `Summary` und `Done` eigene Seiten sind. Der Zustand muss seitenuebergreifend verfuegbar sein.

### Warum ein signal-Service?

Weil Draft und Save-Ergebnis damit:

- zentral
- einfach lesbar
- leicht zuruecksetzbar
- ueber mehrere Wizard-Schritte teilbar

sind.

## Naechste sinnvolle Schritte

Noch offen:

- Leaflet-Integration
- echte Distanz- und Zeitwerte
- spaetere Verfeinerung der Error-/Success-Darstellung
