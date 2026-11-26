import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QRCode, Rate, Result, Slider, Spin, Splitter, Tag, Transfer, Upload } from '../components';

describe('newly provided components', () => {
  it('removes a tag without treating color as the only state', () => {
    function Demo() {
      const [tags, setTags] = useState(['可移除']);
      return <>{tags.map(tag => <Tag key={tag} onClose={() => setTags([])}>{tag}</Tag>)}</>;
    }
    render(<Demo />);
    fireEvent.click(screen.getByRole('button', { name: '移除可移除' }));
    expect(screen.queryByText('可移除')).not.toBeInTheDocument();
  });

  it('changes a rating and a slider through their native controls', () => {
    function Demo() {
      const [score, setScore] = useState(1);
      const [amount, setAmount] = useState(10);
      return <><Rate label="示例评分" value={score} onChange={setScore} /><Slider label="示例数值" value={amount} onChange={setAmount} /></>;
    }
    render(<Demo />);
    fireEvent.click(screen.getByRole('radio', { name: '3 分' }));
    expect(screen.getByRole('radio', { name: '3 分' })).toBeChecked();
    fireEvent.change(screen.getByRole('slider', { name: '示例数值' }), { target: { value: '55' } });
    expect(screen.getByText('55')).toBeInTheDocument();
  });

  it('moves transfer items and records a selected file without uploading', () => {
    function Demo() {
      const [target, setTarget] = useState<string[]>([]);
      const [files, setFiles] = useState<File[]>([]);
      return <><Transfer label="成员" source={[{ id: 'lin', label: '林可' }]} target={target} onChange={setTarget} /><Upload label="选择本地文件" files={files} onChange={setFiles} /></>;
    }
    render(<Demo />);
    fireEvent.click(screen.getByRole('checkbox', { name: '林可' }));
    fireEvent.click(screen.getByRole('button', { name: '移到已选' }));
    expect(screen.getByRole('list', { name: '已选' })).toHaveTextContent('林可');
    const file = new File(['demo'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('选择本地文件'), { target: { files: [file] } });
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '移除 notes.txt' })).toBeEnabled();
  });

  it('keeps loading and result text visible', () => {
    render(<><Spin label="正在读取示例" /><Result status="error" title="读取失败" description="草稿仍在。" /></>);
    expect(screen.getByRole('status')).toHaveTextContent('正在读取示例');
    expect(screen.getByRole('heading', { name: '读取失败' })).toBeInTheDocument();
  });

  it('adjusts a splitter from the keyboard and draws a short code', () => {
    function Demo() {
      const [value, setValue] = useState(40);
      return <Splitter label="左右比例" value={value} onChange={setValue} start={<span>左</span>} end={<span>右</span>} />;
    }
    render(<><Demo /><QRCode label="示例码" value="RHINE" /></>);
    const bar = screen.getByRole('separator', { name: '左右比例' });
    fireEvent.keyDown(bar, { key: 'ArrowRight' });
    expect(bar).toHaveAttribute('aria-valuenow', '45');
    expect(screen.getByRole('img', { name: '示例码：RHINE' })).toBeInTheDocument();
  });
});
