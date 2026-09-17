import { Component, type ReactNode } from "react";

type Props = {
  resetKey: string;
  children: ReactNode;
};

type State = { message: string | null };

export class StageErrorBoundary extends Component<Props, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message || "播放出错" };
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.message) {
      this.setState({ message: null });
    }
  }

  render() {
    if (this.state.message) {
      return (
        <div className="flex aspect-reel h-full w-full items-center justify-center bg-paper px-8 text-center">
          <p className="font-display text-sm text-ink/70">画面加载失败，点「重新播放」</p>
        </div>
      );
    }
    return this.props.children;
  }
}
