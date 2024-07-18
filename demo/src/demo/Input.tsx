import React, { useState } from 'react';
import { DemoPage, DemoSection } from '../components';
import { Input } from '../../../src';

export default () => {
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [value3, setValue3] = useState('');
  const [value4, setValue4] = useState('');
  const [value5, setValue5] = useState('');
  const [value6, setValue6] = useState('');

  return (
    <DemoPage>
      <DemoSection title="Basic Usage">
        <Input value={value1} onChange={setValue1} placeholder="Please enter..." />
      </DemoSection>
      <DemoSection title="Multi-line Input">
        <Input rows={3} value={value2} onChange={setValue2} placeholder="Please enter..." />
      </DemoSection>
      <DemoSection title="Auto Height">
        <Input autoSize value={value3} onChange={setValue3} placeholder="Please enter..." />
      </DemoSection>
      <DemoSection title="Character Limit">
        <Input maxLength={20} value={value4} onChange={setValue4} placeholder="Please enter..." />
      </DemoSection>
      <DemoSection title="Character Limit (Not Displayed)">
        <Input
          maxLength={10}
          value={value5}
          onChange={setValue5}
          placeholder="Search..."
          showCount={false}
        />
      </DemoSection>
      <DemoSection title="Show Character Count">
        <Input value={value6} onChange={setValue6} placeholder="Please enter..." showCount />
      </DemoSection>
      <DemoSection title="Variants">
        <Input placeholder="Default (Outline)" />
        <br />
        <Input placeholder="Outline" variant="outline" />
        <br />
        <Input placeholder="Filled" variant="filled" />
        <br />
        <Input placeholder="Flushed" variant="flushed" />
      </DemoSection>
    </DemoPage>
  );
};