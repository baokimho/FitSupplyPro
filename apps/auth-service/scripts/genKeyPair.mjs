import { generateKeyPair, exportJWK } from 'jose';
import { mkdirSync, writeFileSync } from 'fs';


( async () => {
  mkdirSync('../keys', { recursive: true})
  const { publicKey, privateKey } = await generateKeyPair('RS256', {
    modulusLength: 2048,
    extractable: true,
  });
  const publicJWK  = await exportJWK(publicKey);
  const privateJWK = await exportJWK(privateKey);

  publicJWK.kid  = 'key-1';
  publicJWK.use  = 'sig';
  publicJWK.alg  = 'RS256';

  privateJWK.kid = 'key-1';
  privateJWK.use = 'sig';
  privateJWK.alg = 'RS256';

  writeFileSync('../keys/public.json',  JSON.stringify(publicJWK,  null, 2));
  writeFileSync('../keys/private.json', JSON.stringify(privateJWK, null, 2));

  console.log('Keys generated!');
})()