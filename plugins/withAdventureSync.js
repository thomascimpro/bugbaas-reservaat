const fs=require('fs');
const path=require('path');
const {withAppBuildGradle,withAndroidManifest,withGradleProperties,withMainApplication,withDangerousMod}=require('expo/config-plugins');

module.exports=config=>{
 config=withGradleProperties(config,mod=>{
  const minimum=mod.modResults.find(p=>p.type==='property'&&p.key==='android.minSdkVersion');
  if(minimum)minimum.value=String(Math.max(26,Number(minimum.value)||0));
  else mod.modResults.push({type:'property',key:'android.minSdkVersion',value:'26'});
  return mod;
 });
 config=withAndroidManifest(config,mod=>{
  const manifest=mod.modResults.manifest;
  manifest['uses-permission']??=[];
  for(const permission of ['android.permission.health.READ_STEPS','android.permission.health.READ_DISTANCE'])if(!manifest['uses-permission'].some(p=>p.$['android:name']===permission))manifest['uses-permission'].push({$:{'android:name':permission}});
  manifest.queries??=[{}];manifest.queries[0].package??=[];
  if(!manifest.queries[0].package.some(p=>p.$['android:name']==='com.google.android.apps.healthdata'))manifest.queries[0].package.push({$:{'android:name':'com.google.android.apps.healthdata'}});
  const app=manifest.application[0];app.activity??=[];app['activity-alias']??=[];
  if(!app.activity.some(a=>a.$['android:name']==='.BugBaasHealthRationaleActivity'))app.activity.push({$:{'android:name':'.BugBaasHealthRationaleActivity','android:exported':'true'},'intent-filter':[{'action':[{$:{'android:name':'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE'}}]}]});
  if(!app['activity-alias'].some(a=>a.$['android:name']==='.BugBaasHealthPermissionUsage'))app['activity-alias'].push({$:{'android:name':'.BugBaasHealthPermissionUsage','android:targetActivity':'.BugBaasHealthRationaleActivity','android:exported':'true','android:permission':'android.permission.START_VIEW_PERMISSION_USAGE'},'intent-filter':[{'action':[{$:{'android:name':'android.intent.action.VIEW_PERMISSION_USAGE'}}],'category':[{$:{'android:name':'android.intent.category.HEALTH_PERMISSIONS'}}]}]});
  return mod;
 });
 config=withAppBuildGradle(config,mod=>{
  if(!mod.modResults.contents.includes('androidx.health.connect:connect-client:'))mod.modResults.contents=mod.modResults.contents.replace(/dependencies\s*\{/, 'dependencies {\n    implementation "androidx.health.connect:connect-client:1.1.0"');
  return mod;
 });
 config=withMainApplication(config,mod=>{
  if(mod.modResults.language!=='kt')throw new Error('Adventure Sync expects the existing Kotlin MainApplication.');
  if(!mod.modResults.contents.includes('add(BugBaasAdventureSyncPackage())'))mod.modResults.contents=mod.modResults.contents.replace('PackageList(this).packages.apply {','PackageList(this).packages.apply {\n              add(BugBaasAdventureSyncPackage())');
  return mod;
 });
 return withDangerousMod(config,['android',async mod=>{
  const packageName=mod.android?.package;if(!packageName)throw new Error('Adventure Sync needs the Android application package.');
  const destination=path.join(mod.modRequest.platformProjectRoot,'app','src','main','java',...packageName.split('.'));fs.mkdirSync(destination,{recursive:true});
  for(const filename of ['BugBaasAdventureSyncModule.kt','BugBaasAdventureSyncPackage.kt','BugBaasHealthRationaleActivity.kt']){
   const source=fs.readFileSync(path.join(__dirname,'adventure-sync',filename),'utf8').replaceAll('__PACKAGE__',packageName);fs.writeFileSync(path.join(destination,filename),source);
  }
  return mod;
 }]);
};
