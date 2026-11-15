/* Test voor de admin-gate (server/admin.js): wie is admin? De env wordt vóór de
   import gezet zodat de allowlist klopt. */

process.env.PVA_ADMIN_EMAILS = "boss@x.nl, Admin@Y.NL";
const { isAdminEmail } = await import("../server/admin.js");

let failures = 0;
const check = (n, c) => { console.log(`${c ? "✓" : "✗"} ${n}`); if (!c) failures++; };

check("admin herkend", isAdminEmail("boss@x.nl"));
check("case-insensitive", isAdminEmail("ADMIN@y.nl"));
check("spaties in env getrimd", isAdminEmail("admin@y.nl"));
check("niet-admin geweigerd", !isAdminEmail("random@x.nl"));
check("leeg/null geweigerd", !isAdminEmail("") && !isAdminEmail(null) && !isAdminEmail(undefined));

console.log(failures === 0 ? "\nAlle admin-checks geslaagd." : `\n${failures} admin-check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);
