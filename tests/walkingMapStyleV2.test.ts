import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {StyleSpecification} from 'maplibre-gl';
import {validateStyleMin} from '@maplibre/maplibre-gl-style-spec';
import {CATCH_RADIUS,distance} from '../game/walkingV2';
import {POST_RADIUS} from '../game/worldSitesV2';
import {radiusGeoJSON,radiusLayers} from '../src/walkingMapStyleV2';

test('reach ring is drawn at the shared 80 m interaction radius, clockwise so the inner glow falls inside',()=>{
 assert.equal(CATCH_RADIUS,80);assert.equal(POST_RADIUS,CATCH_RADIUS);
 const fix={lat:51.4416,lng:5.4697,accuracy:5},ring=radiusGeoJSON(fix,CATCH_RADIUS).geometry.coordinates[0];
 assert.deepEqual(ring[0],ring.at(-1));
 for(const [lng,lat] of ring)assert.ok(Math.abs(distance(fix,{lat,lng})-80)<.5);
 // Positive line-offset shifts to the right of travel: north -> east is clockwise, so right is inside.
 assert.ok(ring[16][0]>fix.lng&&Math.abs(ring[16][1]-fix.lat)<1e-9);
});

test('reach ring layers are a valid, clearly visible style and the map uses the radius constant',()=>{
 const layers=radiusLayers('catch-radius'),style:StyleSpecification={version:8,sources:{'catch-radius':{type:'geojson',data:radiusGeoJSON({lat:52,lng:5,accuracy:5},80)}},layers};
 assert.deepEqual(validateStyleMin(style),[]);
 assert.deepEqual(layers.map(l=>l.id),['catch-radius-fill','catch-radius-inner','catch-radius-halo','catch-radius-line']);
 const edge=layers.at(-1)!.paint as Record<string,unknown>;assert.ok((edge['line-opacity'] as number)>=.9,'edge stays bright');
 const explore=readFileSync('src/ExploreV2.web.tsx','utf8');
 assert.match(explore,/radiusGeoJSON\(current\.current\.fix,CATCH_RADIUS\)/);assert.doesNotMatch(explore,/\b65 ?m|binnen 65/);
 // Inside/outside state is a cheap data attribute for bugs, posts and gyms.
 for(const marker of ['bb-wild','bb-post','bb-gym'])assert.match(explore,new RegExp('className="'+marker+'"[^>]*data-near='));
});
