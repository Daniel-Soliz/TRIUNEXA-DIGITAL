import React from 'react';
import { SiteRendererV2 } from './SiteRendererV2';
import { getReferenceDemo } from './referenceDemos';

export default function ReferenceDemoView({ demoKey }: { demoKey: string }) {
  const spec = getReferenceDemo(demoKey);
  if (!spec) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0D0D0D] px-5 text-center text-white">
        <div>
          <h1 className="text-xl font-black">Demonstração não encontrada</h1>
          <p className="mt-2 text-sm text-slate-500">Verifique o link de referência.</p>
        </div>
      </div>
    );
  }

  const printMode = new URLSearchParams(window.location.search).get('print') === '1';
  return <SiteRendererV2 spec={spec} publicMode={!printMode} forceAllPages={printMode} />;
}
