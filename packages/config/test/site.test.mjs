import {test} from 'node:test';
import assert from 'node:assert/strict';
import {businessRoutes,legacyAliases,securityHeaders,maxPageBytes} from '../src/site.js';
test('route contracts retain active business paths and four HTML aliases',()=>{assert.equal(businessRoutes.length,16);assert.equal(new Set(businessRoutes).size,16);assert.equal(legacyAliases.length,4);assert.ok(businessRoutes.includes("games/escape-mawangdui"));assert.ok(!businessRoutes.includes("games/mawangdui-treasure"));for(const {from,to} of legacyAliases){assert.ok(from.endsWith('.html'));assert.ok(businessRoutes.includes(to.slice(1,-1)));}assert.equal(securityHeaders['X-Content-Type-Options'],'nosniff');assert.equal(maxPageBytes,300000);});
