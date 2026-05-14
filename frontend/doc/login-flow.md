# Login Flow: Frontend -> Backend -> Frontend

Diese Datei beschreibt den aktuellen Login-Ablauf im Projekt Schritt fuer Schritt anhand der echten Code-Stellen.

## Uebersicht

Wenn ein Benutzer im Frontend auf den Login-Button drueckt, passiert technisch grob Folgendes:

1. Das Angular-Formular feuert `onSubmit()`.
2. `onSubmit()` ruft den `AuthService` im Frontend auf.
3. Der `AuthService` sendet einen `POST`-Request an das Backend.
4. Das Backend nimmt den Request im `AuthController` entgegen.
5. Der `AuthService` im Backend prueft User + Passwort.
6. Das Backend erstellt ein JWT und speichert eine Session in der DB.
7. Das Backend antwortet mit `token`, `expires_at` und `session_id`.
8. Das Frontend speichert das Token in `localStorage`.
9. Das Frontend navigiert auf `/dashboard`.

## 1. Der Klick auf den Login-Button

Datei: `frontend/src/app/features/auth/login-form/login-form.html`

Der Button liegt innerhalb des Formulars:

```html
<form [formGroup]="loginForm" class="login-form" (ngSubmit)="onSubmit()">
  ...
  <p-button
    type="submit"
    label="Log in"
    [loading]="isSubmitting"
    styleClass="login-button"
  />
</form>
```

Wichtig:

- Das Formular hat `(ngSubmit)="onSubmit()"`.
- Der Button hat `type="submit"`.
- Beim Klick wird also `onSubmit()` in der Komponente aufgerufen.

## 2. Das Frontend verarbeitet den Submit

Datei: `frontend/src/app/features/auth/login-form/login-form.ts`

Die zentrale Methode ist:

```ts
protected onSubmit(): void {
  this.loginForm.markAllAsTouched();
  this.loginError = '';

  if (this.loginForm.invalid) {
    this.loginError = 'Bitte fuelle alle Felder korrekt aus.';
    return;
  }

  this.isSubmitting = true;

  this.authService
    .login(this.loginForm.getRawValue())
    .pipe(finalize(() => (this.isSubmitting = false)))
    .subscribe({
      next: () => {
        void this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.loginError = 'Login fehlgeschlagen. Bitte pruefe Benutzername und Passwort.';
      }
    });
}
```

Was hier konkret passiert:

1. `markAllAsTouched()` markiert die Formularfelder, damit Validierungsfehler sichtbar werden.
2. Wenn das Formular ungueltig ist, wird direkt abgebrochen.
3. Wenn das Formular gueltig ist, wird `authService.login(...)` aufgerufen.
4. Wenn das Backend erfolgreich antwortet, navigiert Angular auf `/dashboard`.
5. Wenn das Backend einen Fehler liefert, wird eine Fehlermeldung angezeigt.

## 3. Welche Daten werden ans Backend geschickt?

Ebenfalls in `frontend/src/app/features/auth/login-form/login-form.ts`:

```ts
this.loginForm = this.formBuilder.nonNullable.group({
  username: ['', [Validators.required]],
  password: ['', [Validators.required]]
});
```

Und der eigentliche Aufruf ist:

```ts
this.authService.login(this.loginForm.getRawValue())
```

`getRawValue()` liefert also ein Objekt in dieser Form:

```json
{
  "username": "deinName",
  "password": "deinPasswort"
}
```

## 4. Der Frontend-AuthService sendet den HTTP-Request

Datei: `frontend/src/app/services/auth.service.ts`

Die Login-Methode:

```ts
login(payload: LoginRequest): Observable<LoginResponse> {
  return this.http
    .post<LoginResponse>(`${this.apiUrl}/login`, payload)
    .pipe(tap((response) => localStorage.setItem(this.tokenStorageKey, response.token)));
}
```

Und die Basis-URL:

```ts
private readonly apiUrl = 'http://localhost:8080/api/user';
```

Das bedeutet:

- Ziel-URL ist `http://localhost:8080/api/user/login`
- HTTP-Methode ist `POST`
- Request-Body ist das Formularobjekt mit `username` und `password`

Zusatz:

```ts
.pipe(tap((response) => localStorage.setItem(this.tokenStorageKey, response.token)));
```

Sobald das Backend erfolgreich antwortet, speichert das Frontend das JWT im Browser:

- Key: `tourplanner.auth.token`
- Ort: `localStorage`

## 5. Angular kann nur deshalb Requests senden, weil HttpClient global aktiviert wurde

Datei: `frontend/src/app/app.config.ts`

```ts
providers: [
  provideBrowserGlobalErrorListeners(),
  provideHttpClient(),
  provideRouter(routes),
  provideAnimationsAsync(),
  providePrimeNG(...)
]
```

Der entscheidende Teil ist:

```ts
provideHttpClient()
```

Ohne diese Zeile koennte `AuthService` keinen HTTP-Request an das Backend schicken.

## 6. Das Backend nimmt den Request entgegen

Datei: `backend/src/main/java/at/fhtw/swen/tourplanner/web/controller/AuthController.java`

Der Login-Endpunkt:

```java
@PostMapping("/user/login")
public LoginResponse login(@RequestBody LoginRequest request) {
    return authService.login(
            request.username(),
            request.password()
    );
}
```

Da der Controller mit `@RequestMapping("/api")` annotiert ist, ist die komplette Route:

```text
POST /api/user/login
```

Das passt exakt zur URL aus dem Frontend-Service.

## 7. Welche Daten erwartet das Backend?

Datei: `backend/src/main/java/at/fhtw/swen/tourplanner/web/request/LoginRequest.java`

```java
public record LoginRequest(
        String username,
        String password
) {
}
```

Das ist der Grund, warum das Frontend ebenfalls `username` und `password` senden muss. Ein Feld wie `email` wuerde hier nicht passen.

## 8. Das Backend prueft Benutzername und Passwort

Datei: `backend/src/main/java/at/fhtw/swen/tourplanner/application/AuthService.java`

Der Anfang der Login-Logik:

```java
public LoginResponse login(String username, String rawPassword) {
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new SecurityException("Invalid credentials"));

    if (!passwordHasher.matches(rawPassword, user.getPassword())) {
        throw new SecurityException("Invalid credentials");
    }
```

Was hier passiert:

1. Das Backend sucht den User per `username`.
2. Wenn kein User gefunden wird, gibt es einen Fehler.
3. Wenn das Passwort nicht zum gespeicherten Hash passt, gibt es ebenfalls einen Fehler.

## 9. Das Backend erzeugt eine Session-ID und ein Ablaufdatum

Weiter in `backend/src/main/java/at/fhtw/swen/tourplanner/application/AuthService.java`:

```java
UUID sessionId = UUIDv7.randomUUID();
Instant expiresAt = Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES);
```

Das bedeutet:

- jede Login-Session bekommt eine eigene `sessionId`
- das Token ist nur begrenzt gueltig

Die Dauer kommt aus:

Datei: `backend/src/main/resources/application.yaml`

```yaml
security:
  jwt:
    expiration-minutes: 20
```

## 10. Das Backend erstellt das JWT

Wieder in `backend/src/main/java/at/fhtw/swen/tourplanner/application/AuthService.java`:

```java
String token = tokenService.createToken(
        user.getId(),
        user.getUsername(),
        sessionId,
        expiresAt
);
```

Die eigentliche JWT-Erzeugung steckt in:

Datei: `backend/src/main/java/at/fhtw/swen/tourplanner/infrastructure/security/JwtTokenService.java`

```java
return Jwts.builder()
        .subject(username)
        .claim("uid", userId.toString())
        .id(sessionId.toString())
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiresAt))
        .signWith(secretKey)
        .compact();
```

Das Token enthaelt also unter anderem:

- `subject(username)` -> Benutzername
- `uid` -> User-ID
- `id(sessionId)` -> Session-ID / JTI
- `expiration(...)` -> Ablaufzeitpunkt

## 11. Das Backend speichert die Session in der Datenbank

Noch in `backend/src/main/java/at/fhtw/swen/tourplanner/application/AuthService.java`:

```java
Session session = new Session(
        sessionId,
        user.getId(),
        token,
        Instant.now(),
        expiresAt,
        false
);

sessionRepository.save(session);
```

Das ist der Punkt, an dem nicht nur ein Token erzeugt wird, sondern die Session auch persistent gespeichert wird.

Die Persistierung passiert in:

Datei: `backend/src/main/java/at/fhtw/swen/tourplanner/infrastructure/persistence/JpaSessionRepositoryAdapter.java`

```java
@Override
public Session save(Session session){
    SessionEntity saved = repository.save(toEntity(session));
    return toDomain(saved);
}
```

Die zugehoerige Tabelle ist in:

Datei: `backend/init.sql`

```sql
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jti UUID NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    token TEXT NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    ...
);
```

## 12. Das Backend antwortet an das Frontend

Am Ende von `backend/src/main/java/at/fhtw/swen/tourplanner/application/AuthService.java`:

```java
return new LoginResponse(token, expiresAt, sessionId);
```

Die Response-Struktur ist definiert in:

Datei: `backend/src/main/java/at/fhtw/swen/tourplanner/web/response/LoginResponse.java`

```java
public record LoginResponse(
        String token,
        @JsonProperty("expires_at") Instant expiresAt,
        @JsonProperty("session_id") UUID sessionId
) {
}
```

Die JSON-Antwort sieht also sinngemaess so aus:

```json
{
  "token": "eyJ...",
  "expires_at": "2026-03-22T12:34:56Z",
  "session_id": "..."
}
```

## 13. Das Frontend bekommt die Response und speichert das Token

Zurueck in `frontend/src/app/services/auth.service.ts`:

```ts
.pipe(tap((response) => localStorage.setItem(this.tokenStorageKey, response.token)));
```

Das bedeutet:

- das JWT wird direkt nach erfolgreichem Login im Browser gespeichert
- spaetere Requests koennen dieses Token wiederverwenden

## 14. Das Frontend navigiert auf das Dashboard

Wieder in `frontend/src/app/features/auth/login-form/login-form.ts`:

```ts
subscribe({
  next: () => {
    void this.router.navigateByUrl('/dashboard');
  },
  ...
});
```

Das passiert nur dann, wenn der Backend-Request erfolgreich war.

Die Route ist definiert in:

Datei: `frontend/src/app/app.routes.ts`

```ts
{
  path: 'dashboard',
  component: Dashboard
}
```

Deshalb landet der Benutzer nach erfolgreichem Login auf `/dashboard`.

## 15. Was passiert bei einem Fehler?

Falls das Backend `401`, `403`, `500` oder einen anderen Fehler liefert, landet das Frontend hier:

```ts
error: () => {
  this.loginError = 'Login fehlgeschlagen. Bitte pruefe Benutzername und Passwort.';
}
```

Dann:

- wird nicht auf `/dashboard` navigiert
- das Token wird nicht gespeichert
- der Benutzer bleibt auf der Login-Seite

## 16. Was passiert bei Fehlereingaben im Frontend?

Fehlereingaben koennen bereits abgefangen werden, bevor ueberhaupt ein Request ans Backend gesendet wird.

Datei: `frontend/src/app/features/auth/login-form/login-form.ts`

```ts
protected onSubmit(): void {
  this.loginForm.markAllAsTouched();
  this.loginError = '';

  if (this.loginForm.invalid) {
    this.loginError = 'Bitte fuelle alle Felder korrekt aus.';
    this.changeDetectorRef.detectChanges();
    return;
  }

  ...
}
```

Das bedeutet:

1. Beim Klick auf `Log in` werden zuerst alle Felder als `touched` markiert.
2. Danach prueft Angular, ob das Formular ungueltig ist.
3. Wenn zum Beispiel `username` oder `password` leer ist, wird der Request sofort abgebrochen.
4. Stattdessen wird direkt die Fehlermeldung `Bitte fuelle alle Felder korrekt aus.` gesetzt.

Die sichtbaren Feldfehler kommen aus diesen Methoden:

```ts
protected showRequiredError(controlName: 'username' | 'password'): boolean {
  const control = this.loginForm.controls[controlName];
  return control.touched && control.hasError('required');
}
```

Und in der HTML:

Datei: `frontend/src/app/features/auth/login-form/login-form.html`

```html
@if (showRequiredError('username')) {
  <p class="field-error">Username is required.</p>
}

@if (showRequiredError('password')) {
  <p class="field-error">Password is required.</p>
}
```

Das heisst:

- leeres `username`-Feld -> `Username is required.`
- leeres `password`-Feld -> `Password is required.`
- zusaetzlich globale Formularmeldung -> `Bitte fuelle alle Felder korrekt aus.`

In diesem Fall passiert **kein** HTTP-Request an das Backend.

## 17. Was passiert bei falschem Benutzer oder falschem Passwort?

Wenn das Formular gueltig ist, aber die Zugangsdaten fachlich falsch sind, wird der Request sehr wohl ans Backend gesendet.

Frontend:

```ts
this.authService
  .login(this.loginForm.getRawValue())
  .pipe(finalize(() => {
    this.isSubmitting = false;
    this.changeDetectorRef.detectChanges();
  }))
  .subscribe({
    next: () => {
      void this.router.navigateByUrl('/dashboard');
    },
    error: () => {
      this.loginError = 'Login fehlgeschlagen. Bitte pruefe Benutzername und Passwort.';
      this.changeDetectorRef.detectChanges();
    }
  });
```

Backend:

Datei: `backend/src/main/java/at/fhtw/swen/tourplanner/application/AuthService.java`

```java
User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new SecurityException("Invalid credentials"));

if (!passwordHasher.matches(rawPassword, user.getPassword())) {
    throw new SecurityException("Invalid credentials");
}
```

Wenn der Benutzer nicht existiert oder das Passwort falsch ist:

1. Das Backend wirft `SecurityException("Invalid credentials")`.
2. Der Login-Request endet mit einem Fehler, typischerweise `401`.
3. Das Frontend landet im `error`-Block des `subscribe(...)`.
4. `loginError` wird auf `Login fehlgeschlagen. Bitte pruefe Benutzername und Passwort.` gesetzt.
5. Der Benutzer bleibt auf der Login-Seite.
6. Es wird **kein** Token gespeichert.
7. Es erfolgt **keine** Navigation auf `/dashboard`.

## 18. Unterschied: Eingabefehler vs. Backend-Loginfehler

Es gibt also zwei verschiedene Fehlerarten:

1. Formularfehler im Frontend
   - Beispiel: Feld leer
   - Folge: kein Request wird gesendet
   - Meldung: `Bitte fuelle alle Felder korrekt aus.`

2. Loginfehler aus dem Backend
   - Beispiel: falscher Benutzername oder falsches Passwort
   - Folge: Request wird gesendet, Backend antwortet mit Fehler
   - Meldung: `Login fehlgeschlagen. Bitte pruefe Benutzername und Passwort.`

## 19. End-to-End-Beispiel

Beispielablauf:

1. Benutzer gibt `username = max` und `password = abc` ein.
2. Klick auf `Log in`.
3. Angular ruft `onSubmit()` auf.
4. `onSubmit()` ruft `authService.login(...)` auf.
5. `AuthService` sendet `POST http://localhost:8080/api/user/login`.
6. `AuthController.login(...)` nimmt den Request entgegen.
7. `AuthService.login(...)` sucht den User und prueft das Passwort.
8. Backend erstellt `sessionId`, `expiresAt` und das JWT.
9. Backend speichert die Session in `sessions`.
10. Backend gibt `LoginResponse` zurueck.
11. Frontend speichert `response.token` in `localStorage`.
12. Frontend navigiert auf `/dashboard`.

## 20. Wichtige Abhaengigkeiten, damit der Flow funktioniert

- Das Backend muss auf `http://localhost:8080` laufen.
- Das Frontend muss auf `http://localhost:4200` laufen.
- CORS muss im Backend freigegeben sein.
- Ein passender Benutzer muss in der DB existieren.
- Das Frontend muss dieselben Feldnamen schicken, die das Backend erwartet.

## 21. Aktuell beteiligte Dateien

Frontend:

- `frontend/src/app/features/auth/login-form/login-form.html`
- `frontend/src/app/features/auth/login-form/login-form.ts`
- `frontend/src/app/services/auth.service.ts`
- `frontend/src/app/app.config.ts`
- `frontend/src/app/app.routes.ts`

Backend:

- `backend/src/main/java/at/fhtw/swen/tourplanner/web/controller/AuthController.java`
- `backend/src/main/java/at/fhtw/swen/tourplanner/web/request/LoginRequest.java`
- `backend/src/main/java/at/fhtw/swen/tourplanner/application/AuthService.java`
- `backend/src/main/java/at/fhtw/swen/tourplanner/infrastructure/security/JwtTokenService.java`
- `backend/src/main/java/at/fhtw/swen/tourplanner/infrastructure/persistence/JpaSessionRepositoryAdapter.java`
- `backend/src/main/java/at/fhtw/swen/tourplanner/web/response/LoginResponse.java`
- `backend/src/main/resources/application.yaml`
- `backend/init.sql`
