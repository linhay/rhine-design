import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { StatusTimeline, TimelineLegend } from '../components';

it('announces time and evidence with a single native range control, including unknown and empty states',()=>{
  const {rerender}=render(<><StatusTimeline label="账号历史" startLabel="昨天" endLabel="今天" segments={[{id:'a',label:'10:00',status:'failed'},{id:'b',label:'10:15',status:'unknown'}]}/><TimelineLegend/></>);
  const slider=screen.getByRole('slider',{name:'账号历史'});
  expect(slider).toHaveAttribute('aria-valuetext','10:15 · 未知 / 无数据');
  fireEvent.change(slider,{target:{value:'0'}});
  expect(slider).toHaveAttribute('aria-valuetext','10:00 · 存在最终失败');
  expect(screen.getByRole('list',{name:'健康记录图例'})).toHaveTextContent('重试已恢复');
  rerender(<StatusTimeline label="账号历史" startLabel="昨天" endLabel="今天" segments={[]}/>);
  expect(screen.getByRole('slider')).toBeDisabled();
  expect(screen.getByText('暂无记录')).toBeVisible();
});
