# Adopted FV + MOVE TO NARA release checks

The accepted homepage designs are integrated on origin/main 7b4d9f5193d7feecf897c6a165fd5f3a2d109724. Nara source commit: 534548c9ad9606645f797973f9642ce94a13c188. Only the FV/header, Nara section and required assets/gates change. Other sections, canonical pages, data, API and Vercel configuration remain unchanged.

- Existing allow-list build succeeds; runtime bytes match the package.
- Homepage/FV/Nara content gates pass, including 16 rejected regression cases.
- FV: 22 interaction checks, 18-second loops on PC/SP, fallbacks and responsive continuity.
- Nara: 6 sizes, both origins, source disclosure and both exits.
- Integrated Chromium/WebKit PC/SP: media, menus, contact dialogs, links and zero page exceptions.
- Lower 8 regions: PC/SP 369 elements each, no computed-style changes.
- Current source/screenshot hashes are in receipt.json; review gate passes.

User authorized commit, push and production release. The production deployment and external URL verification are a separate post-push record. Real iPhone/OS tab visibility and live inquiry submission are not claimed.
