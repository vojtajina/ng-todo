/**
 * The angular-wakanda-connector wraps the rest connection to the WakandaDB in an angular service.
 * 
 * It ships 2 classes from the WAF (Wakanda Framework), unchanged :
 * - Rest.js
 * - Data-Provider.js (depends on Rest.js)
 * 
 * The boot.js file is a simple file to make the others work outside of the Wakanda Framework.
 */
WAF = {
    core : {},
    config : {}
};