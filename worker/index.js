
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Words reminder";
  const options = {
    body: data.body || "Ugee tseejleerei!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || "vocab-reminder",
    data: { url: data.url || "/?view=learn" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/?view=learn", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && new URL(client.url).origin === self.location.origin) {
          if ("navigate" in client) {
            return client.navigate(url).then((focusedClient) => focusedClient?.focus());
          }

          return client.focus();
        }
      }

      return clients.openWindow(url);
    })
  );
});
