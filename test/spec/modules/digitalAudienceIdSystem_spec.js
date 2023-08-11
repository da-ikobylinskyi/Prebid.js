import { digitalAudienceIdSubmodule } from 'modules/digitalAudienceIdSystem.js';
import * as utils from 'src/utils.js';
import { server } from 'test/mocks/xhr.js';

const publisherId = '4D393FAC-B6BB-4E19-8396-0A4813607316';
const getIdParams = { params: { publisherId: publisherId } };
describe('digitalAudienceId tests', function () {
  let logErrorStub;

  beforeEach(function () {
    logErrorStub = sinon.stub(utils, 'logError');
  });

  afterEach(function () {
    logErrorStub.restore();
  });

  it('should log an error if publisherId configParam was not passed when getId', function () {
    digitalAudienceIdSubmodule.getId();
    expect(logErrorStub.callCount).to.be.equal(1);

    digitalAudienceIdSubmodule.getId({});
    expect(logErrorStub.callCount).to.be.equal(2);

    digitalAudienceIdSubmodule.getId({ params: {} });
    expect(logErrorStub.callCount).to.be.equal(3);

    digitalAudienceIdSubmodule.getId({ params: { publisherId: 123 } });
    expect(logErrorStub.callCount).to.be.equal(4);
  });

  it('should NOT call the digitalAudience id endpoint if gdpr applies but consent string is missing', function () {
    let submoduleCallback = digitalAudienceIdSubmodule.getId(getIdParams, { gdprApplies: true });
    expect(submoduleCallback).to.be.undefined;
  });

  it('should call the digitalAudience id endpoint', function () {
    let callBackSpy = sinon.spy();
    let submoduleCallback = digitalAudienceIdSubmodule.getId(getIdParams).callback;
    submoduleCallback(callBackSpy);
    let request = server.requests[0];
    expect(request.url).to.be.eq(`https://target.digialaudience.io/bakery/bake?publisher=${publisherId}`);
    request.respond(
      200,
      {},
      JSON.stringify({})
    );
    expect(callBackSpy.calledOnce).to.be.true;
  });

  it('should call callback with user id', function () {
    let callBackSpy = sinon.spy();
    let submoduleCallback = digitalAudienceIdSubmodule.getId(getIdParams).callback;
    submoduleCallback(callBackSpy);
    let request = server.requests[0];
    expect(request.url).to.be.eq(`https://target.digialaudience.io/bakery/bake?publisher=${publisherId}`);
    request.respond(
      200,
      {},
      JSON.stringify({ setData: { visitorid: '571058d70bce453b80e6d98b4f8a81e3' } })
    );
    expect(callBackSpy.calledOnce).to.be.true;
    expect(callBackSpy.args[0][0]).to.be.eq('571058d70bce453b80e6d98b4f8a81e3');
  });

  it('should continue to callback if ajax response 204', function () {
    let callBackSpy = sinon.spy();
    let submoduleCallback = digitalAudienceIdSubmodule.getId(getIdParams).callback;
    submoduleCallback(callBackSpy);
    let request = server.requests[0];
    expect(request.url).to.be.eq(`https://target.digialaudience.io/bakery/bake?publisher=${publisherId}`);
    request.respond(
      204
    );
    expect(callBackSpy.calledOnce).to.be.true;
    expect(callBackSpy.args[0][0]).to.be.undefined;
  });
});
