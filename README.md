# City Scraper

Event exploration and management tool. Scrapes event-hosting websites like Luma, EventBrite, and Ticketmaster's public APIs to suggest events for users based on their inputted location, availability throughout the week, location, and range of commutable distance.

Try it yourself, clone the repo and run

```
npm install
npx expo start
```

then, open it in your browser or the Expo Go app.

## Screenshots

Recommended events are displayed with their location on a map, with an event card containing basic information. Tapping on the card centralizes the user's view of the event on the map, and tapping again opens an expanded modal with more event information and a link to the external listing. Swiping left archives the event, swiping right saves it.

<div>
<img src="screenshots/functionality/loading.png" width="140.333" height="286.33" alt="Part of failing the cooking sequence">
<img src="screenshots/functionality/card.png" width="140.333" height="286.33" alt="Part of failing the cooking sequence">
<img src="screenshots/functionality/expanded.png" width="140.333" height="286.33" alt="Part of failing the cooking sequence">
<img src="screenshots/functionality/pinned.png" width="140.333" height="286.33" alt="Part of failing the cooking sequence">
</div>
<br>

On signing in, users enter basic information and their preferences for events, they can return to their settings page to edit this information. Editing preferences will reload the recommendations, but keep pinned events safe.>

<div>
<img src="screenshots/settings/settings.png" width="140.333" height="286.33" alt="Part of failing the cooking sequence">
<img src="screenshots/settings/location.png" width="140.333" height="286.33" alt="Part of failing the cooking sequence">
<img src="screenshots/settings/availability.png" width="140.333" height="286.33" alt="Part of failing the cooking sequence">
<img src="screenshots/settings/interests.png" width="140.333" height="286.33" alt="Part of failing the cooking sequence">

</div>
<br>

Check out this [video demo](https://youtu.be/IEIi_-E4XUI) - submitted to the 2026 Congressional App Challenge.

## Try it yourself

Download the Expo Go app and scan the QR code

<img src="screenshots/functionality/qr-code.png" width="150" height="150" alt="Part of failing the cooking sequence">

<!-- ## Deploying

The `/api/events` scraper runs on EAS Hosting at https://emilyahmad.expo.app, and the app reaches it through the `origin` set on the `expo-router` plugin in `app.json`. The phone app is delivered with EAS Update and opened in Expo Go.

```bash
# API / scraper or web changes
npx expo export -p web && eas deploy --prod

# App changes. Exports plain JS (Expo Go can't run Hermes bytecode) and publishes to the production channel
npm run update -- --message "..."

# API keys for the key-gated sources
eas env:create --environment production --visibility secret --name TICKETMASTER_API_KEY --value ...
``` -->
