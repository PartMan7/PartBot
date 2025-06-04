# Web

PartBot's Web module handles networks and routing, including a CDN and a filehost.

The production deployment uses the NGINX configs defined in `@/web/configs`, which are build through the `build-configs`
script. This may be safely ignored if you do not plan on using an NGINX configuration.
