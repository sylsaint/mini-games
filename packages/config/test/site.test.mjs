import {test} from 'node:test';
import assert from 'node:assert/strict';
import {businessRoutes,legacyAliases,securityHeaders,maxPageBytes} from '../src/site.js';
test('route contracts retain all historical business paths and four HTML aliases',()=>{assert.equal(businessRoutes.length,15);assert.equal(new Set(businessRoutes).size,15);assert.equal(legacyAliases.length,4);for(const {from,to} of legacyAliases){assert.ok(from.endsWith('.html'));assert.ok(businessRoutes.includes(to.slice(1,-1)));}assert.equal(securityHeaders['X-Content-Type-Options'],'nosniff');assert.equal(maxPageBytes,300000);});
