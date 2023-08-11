/**
 * This module adds digitalAudienceId to the User ID module
 * The {@link module:modules/userId} module is required
 * @module modules/digitalAudienceIdSubmodule
 * @requires module:modules/userId
 */

import { logError, logInfo } from '../src/utils.js'
import { ajax } from '../src/ajax.js';
import { submodule } from '../src/hook.js';
import { getStorageManager } from '../src/storageManager.js';
import { MODULE_TYPE_UID } from '../src/activities/modules.js';

const NAME = 'digitalAudienceId';
export const storage = getStorageManager({ moduleType: MODULE_TYPE_UID, moduleName: NAME });

/** @type {Submodule} */
export const digitalAudienceIdSubmodule = {
  /**
   * used to link submodule with config
   * @type {string}
   */
  name: NAME,
  /**
   * used to specify vendor id
   * @type {number}
   */
  gvlid: 133,
  /**
   * decode the stored id value for passing to bid requests
   * @function
   * @param {string} value
   * @returns {{digitalAudienceId:string}}
   */
  decode(value) {
    return { 'digitalAudienceId': value }
  },
  /**
   * performs action to obtain id and return a value in the callback's response argument
   * @function
   * @param {SubmoduleConfig} [config]
   * @param {ConsentData} [consentData]
   * @returns {IdResponse|undefined}
   */
  getId(config, consentData) {
    const { emailHash, p, publisherId } = (config && config.params) || {};
    if (!publisherId || typeof publisherId !== 'string') {
      logError('digitalAudience id submodule requires publisher id to be defined');
      return;
    }
    const gdpr = (consentData && typeof consentData.gdprApplies === 'boolean' && consentData.gdprApplies) ? 1 : 0;
    const consentString = gdpr ? consentData.consentString : '';
    if (gdpr && !consentString) {
      logInfo('Consent string is required to call digitalAudience id.');
      return;
    }
    const url = `https://target.digialaudience.io/bakery/bake?publisher=${publisherId}${emailHash ? `&email=${emailHash}` : ''}${p ? `&phone=${p}` : ''}${consentString ? `&gdpr=1&gdpr_consent=${consentString}` : ''}`;
    const resp = function (callback) {
      retrieveVisitorId(url, callback);
    };

    return { callback: resp };
  },
  eids: {
    'digitalAudienceId': {
      source: 'digitalaudience.io',
      atype: 3
    }
  }
};

function retrieveVisitorId(url, callback) {
  ajax(url, {
    success: response => {
      const { setData: { visitorid } = {} } = JSON.parse(response || '{}');
      if (visitorid) {
        callback(visitorid);
      } else {
        callback();
      }
    },
    error: error => {
      logInfo(`digitalAudienceId: fetch encountered an error`, error);
      callback();
    }
  }, undefined, { method: 'GET', withCredentials: true });
}

submodule('userId', digitalAudienceIdSubmodule);
