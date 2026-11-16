import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Image } from '../components';

describe('Image resource lifecycle',()=>{
  it('reports loading/loaded without declaring a pending image successful',()=>{
    const{container}=render(<Image alt="合成图片" src="a.svg"/>);const trigger=screen.getByRole('button',{name:'查看合成图片'});
    expect(trigger).toHaveAttribute('data-image-state','loading');expect(screen.getByRole('status')).toHaveTextContent('正在读取缩略图');
    fireEvent.load(container.querySelector('img')!);expect(trigger).toHaveAttribute('data-image-state','loaded');expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('renders failure, retries by creating a fresh resource and ignores detached late events',()=>{
    const{container}=render(<Image alt="失败图片" src="bad.svg"/>);const old=container.querySelector('img')!;fireEvent.error(old);
    expect(screen.getByRole('alert')).toHaveTextContent('缩略图读取失败');const retry=screen.getByRole('button',{name:'重试缩略图'});act(()=>retry.focus());fireEvent.click(retry);
    const fresh=container.querySelector('img')!;expect(fresh).not.toBe(old);expect(screen.getByRole('button',{name:'查看失败图片'})).toHaveAttribute('data-image-state','loading');
    fireEvent.load(old);expect(screen.getByRole('button',{name:'查看失败图片'})).toHaveAttribute('data-image-state','loading');fireEvent.load(fresh);expect(retry).toHaveFocus();expect(screen.getByRole('button',{name:'查看失败图片'})).toHaveAttribute('data-image-state','loaded');
  });
  it('cannot start concurrent retry attempts while already loading',()=>{
    const{container}=render(<Image alt="读取中" src="a.svg"/>);const image=container.querySelector('img'),retry=container.querySelector('.rhine-image>button')!;fireEvent.click(retry);expect(container.querySelector('img')).toBe(image);
  });
  it('resets error state on every committed source switch, including returning to the old URL',()=>{
    const{container,rerender}=render(<Image alt="换源" src="a.svg"/>);fireEvent.error(container.querySelector('img')!);rerender(<Image alt="换源" src="b.svg"/>);expect(container.querySelector('img')).toHaveAttribute('src','b.svg');expect(screen.queryByRole('alert')).not.toBeInTheDocument();fireEvent.load(container.querySelector('img')!);rerender(<Image alt="换源" src="a.svg"/>);expect(container.querySelector('img')).toHaveAttribute('src','a.svg');expect(screen.getByRole('button',{name:'查看换源'})).toHaveAttribute('data-image-state','loading');
  });
  it('provides an independent preview error/retry lifecycle and retains its close path',async()=>{
    render(<Image alt="预览" src="a.svg"/>);fireEvent.click(screen.getByRole('button',{name:'查看预览'}));const dialog=await screen.findByRole('dialog',{name:'预览'});const image=within(dialog).getByRole('img',{name:'预览'});fireEvent.error(image);
    const retry=within(dialog).getByRole('button',{name:'重试图片'});act(()=>retry.focus());fireEvent.click(retry);const fresh=within(dialog).getByRole('img',{name:'预览'});fireEvent.load(fresh);expect(retry).toHaveFocus();expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();fireEvent.click(within(dialog).getByRole('button',{name:'关闭对话框'}));await waitFor(()=>expect(screen.getByRole('button',{name:'查看预览'})).toHaveFocus());
  });
  it('recovers focus locally if the source disappears while its retry control owns focus',async()=>{
    const{rerender}=render(<Image alt="资源移除" src="bad.svg"/>);fireEvent.click(screen.getByRole('button',{name:'查看资源移除'}));const dialog=await screen.findByRole('dialog',{name:'资源移除'});fireEvent.error(within(dialog).getByRole('img',{name:'资源移除'}));act(()=>within(dialog).getByRole('button',{name:'重试图片'}).focus());rerender(<Image alt="资源移除"/>);
    expect(within(dialog).getByRole('group',{name:'资源移除图片资源'})).toHaveFocus();expect(within(dialog).getByText('资源移除（没有提供图片）')).toBeInTheDocument();
  });
  it('does not steal a deliberate close-control focus when a source changes',async()=>{
    const{rerender}=render(<Image alt="主控交焦" src="bad.svg"/>);fireEvent.click(screen.getByRole('button',{name:'查看主控交焦'}));const dialog=await screen.findByRole('dialog',{name:'主控交焦'}),close=within(dialog).getByRole('button',{name:'关闭对话框'});act(()=>close.focus());rerender(<Image alt="主控交焦"/>);expect(close).toHaveFocus();
  });
});
