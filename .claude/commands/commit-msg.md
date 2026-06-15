# commit-msg

커밋 메시지를 자동으로 작성한다.

## 실행 순서

1. `git status`를 실행해 변경된 파일 목록을 확인한다. staged 여부에 관계없이 변경된 파일 전체를 아래 형식으로 사용자에게 보여준다:

```
변경된 파일:
  M .claude/settings.json      (staged)
  ?? .claude/commands/foo.md   (untracked)
  M src/App.tsx                (unstaged)
```

2. 별다른 지시가 없으면 `git add .`를 바로 실행한다. 특정 파일만 stage하라는 지시가 있으면 해당 파일만 추가한다.

3. `git diff --staged`로 staged된 변경사항을 분석한다.

4. `git log --oneline -3`으로 최근 커밋 스타일을 참고한다.

5. `CLAUDE.md`의 커밋 컨벤션을 따라 아래 형식으로 메시지를 작성한다:

```
<type>: <description>

[optional body]
```

- `description`: 현재형, 소문자, 마침표 없이
- `body`: 왜 했는지 / 주요 결정사항 — 꼭 필요할 때만 작성

6. 작성한 커밋 메시지를 출력한다. 사용자가 확인/수정 후 직접 커밋할 예정이므로 커밋은 실행하지 않는다.
