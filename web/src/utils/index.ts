import { Base64 } from 'js-base64';
import JSEncrypt from 'jsencrypt';

export const rsaPsw = (password: string) => {
  const pub =
    '-----BEGIN PUBLIC KEY-----\n' +
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArq9XTUSeYr2+N1h3Afl/\n' +
    'z8Dse/2yD0ZGrKwx+EEEcdsBLca9Ynmx3nIB5obmLlSfmskLpBo0UACBmB5rEjBp\n' +
    '2Q2f3AG3Hjd4B+gNCG6BDaawuDlgANIhGnaTLrIqWrrcm4EMzJOnAOI1fgzJRsOO\n' +
    'UEfaS318Eq9OVO3apEyCCt0lOQK6PuksduOjVxtltDav+guVAA068NrPYmRNabVK\n' +
    'RNLJpL8w4D44sfth5RvZ3q9t+6RTArpEtc5sh5ChzvqPOzKGMXW83C95TxmXqpbK\n' +
    '6olN4RevSfVjEAgCydH6HN6OhtOQEcnrU97r9H0iZOWwbw3pVrZiUkuRD1R56Wzs\n' +
    '2wIDAQAB\n' +
    '-----END PUBLIC KEY-----';
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(pub);
  return encryptor.encrypt(Base64.encode(password));
};
