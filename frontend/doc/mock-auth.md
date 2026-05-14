# Mock-Auth

Dieses Frontend unterstuetzt einen einfachen Mock-Authentifizierungsmodus fuer lokale UI-Tests, ohne dass das Backend gestartet werden muss.

## Ort

Der Schalter befindet sich in:

- `frontend/src/app/core/config/api.config.ts`

## Einstellung

```ts
export const USE_MOCK_AUTH = true;
```

## Bedeutung

### `USE_MOCK_AUTH = true`

- der Frontend-Login verwendet einen statischen Mock-User
- die Registrierung wird lokal simuliert
- der Logout wird lokal simuliert
- es werden keine echten Auth-Requests an das Backend gesendet
- sinnvoll, wenn nur `ng serve` laeuft

Mock-Login-Daten:

- Benutzername: `testuser`
- Passwort: `test1234`

### `USE_MOCK_AUTH = false`

- das Frontend verwendet die echten Backend-Auth-Endpoints
- Login, Registrierung und Logout werden an `http://localhost:8080/api` gesendet
- das Backend muss laufen

## Wichtiger Hinweis

Wenn `USE_MOCK_AUTH = true` gesetzt ist und gleichzeitig das Backend laeuft, verwendet das Frontend fuer Auth trotzdem den Mock-Flow.
Fuer echte Backend-Auth-Tests muss der Wert also auf `false` gesetzt werden.
