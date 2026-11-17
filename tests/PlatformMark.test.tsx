import { fireEvent,render,screen } from '@testing-library/react';
import { describe,it,expect,vi } from 'vitest';
import { PlatformMark,ButtonLink,Menu,Button,type PlatformName } from '../components';
import { PlatformMarksExample } from '../preview/ManagementIconsGallery';
describe('licensed platform marks',()=>{
 it.each(['macos','windows'] as const)('provides inline, currentColor %s geometry with explicit naming',platform=>{
  const {container,rerender}=render(<PlatformMark platform={platform} size={16}/>);
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden','true');expect(container.querySelector('path')?.getAttribute('d')).toBeTruthy();expect(container.querySelector('svg')).toHaveAttribute('fill','currentColor');expect(container.querySelector('img,use,image')).toBeNull();
  rerender(<PlatformMark platform={platform} decorative={false}/>);expect(screen.getByRole('img',{name:platform==='macos'?'macOS 平台':'Windows 平台'})).toHaveAttribute('width','20');
 });
 it('does not mislabel unsupported input as a supported platform',()=>{render(<PlatformMark platform={'linux' as PlatformName}/>);expect(screen.getByText('未支持的平台')).toBeVisible();expect(document.querySelector('svg')).toBeNull();});
 it('keeps full platform text on unavailable downloads and blocks actions',()=>{const click=vi.fn();const {rerender}=render(<ButtonLink href="#synthetic" onClick={click} busy><PlatformMark platform="macos"/>下载 macOS 版本</ButtonLink>);const link=screen.getByRole('link');expect(link).not.toHaveAttribute('href');fireEvent.click(link);expect(click).not.toHaveBeenCalled();rerender(<ButtonLink href="#synthetic" onClick={click} disabled>下载 macOS 版本</ButtonLink>);expect(screen.getByRole('link')).toHaveAttribute('tabindex','-1');});
 it('shows unsupported fallback without starting a resource request',()=>{render(<PlatformMarksExample/>);fireEvent.change(screen.getByLabelText('未知平台后备'),{target:{value:'unsupported'}});expect(screen.getByText('未支持的平台')).toBeVisible();expect(document.querySelector('img')).toBeNull();});
 it('renders menu icons decoratively without changing command names',()=>{render(<Menu label="动作" trigger={<Button>打开动作</Button>} items={[{id:'export',label:'导出',icon:'export',onSelect:()=>{}}]}/>);fireEvent.pointerDown(screen.getByRole('button',{name:'打开动作'}),{button:0,ctrlKey:false});expect(screen.getByRole('menuitem',{name:'导出'}).querySelector('svg')).toHaveAttribute('aria-hidden','true');});
});
