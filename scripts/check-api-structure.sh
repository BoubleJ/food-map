#!/usr/bin/env zsh
# apps/api/src 폴더 이름이 kebab-case 인지, 폴더가 허용하는 위치에 있는지 검사한다.
#   폴더 목록은 .oxlintrc.json 의 settings["food-map"] 에서 읽는다. lint 규칙과 같은 값을 쓰려고 목록을 두 곳에 두지 않는다
set -u
cd "${0:A:h}/.." || exit 1

read_setting() {
  node -e '
    const { settings } = JSON.parse(require("fs").readFileSync(".oxlintrc.json", "utf8"))
    const value = settings["food-map"][process.argv[1]]
    if (typeof value === "string") console.log(value)
    else if (Array.isArray(value)) console.log(value.join("\n"))
    else console.log(Object.entries(value).flatMap(([key, child]) => Array.isArray(child) ? child.map((item) => `${key}/${item}`) : [key]).join("\n"))
  ' "$1"
}

src=apps/api/src
role_folders=(${(f)"$(read_setting roleFolders)"})
nest_file_kinds=(${(f)"$(read_setting nestFileKinds)"})
shared_folder=$(read_setting sharedFolder)
shared_child_folders=(${(f)"$(read_setting sharedChildFolders)"} $role_folders)
infra_paths=(${(f)"$(read_setting infraFolders)"})
infra_folders=(${infra_paths%%/*})

is_feature_folder() {
  local folder=$1 kind
  for kind in $nest_file_kinds; do
    [[ -e $folder/${folder:t}.$kind.ts ]] && return 0
  done
  return 1
}

is_allowed_location() {
  local folder=$1 name=${1:t} parent=${1:h}
  if [[ $parent == $src ]]; then
    [[ $name == $shared_folder ]] || (( ${infra_folders[(Ie)$name]} )) || is_feature_folder $folder
    return
  fi
  if [[ $parent == $src/$shared_folder ]]; then
    (( ${shared_child_folders[(Ie)$name]} ))
    return
  fi
  if [[ ${parent:h} == $src ]] && (( ${infra_paths[(Ie)${parent:t}/$name]} )); then
    return 0
  fi
  if (( ${role_folders[(Ie)$name]} )); then
    is_feature_folder $parent
    return
  fi
  is_feature_folder $folder
}

not_kebab_case=()
misplaced=()
for folder in $src/**/*(/N); do
  [[ $folder == $src/$shared_folder || ${folder:t} =~ '^[a-z0-9]+(-[a-z0-9]+)*$' ]] || not_kebab_case+=($folder)
  is_allowed_location $folder || misplaced+=($folder)
done

if (( ${#not_kebab_case} )); then
  print -r -- "폴더 이름은 kebab-case 로 짓는다."
  print -rl -- ${not_kebab_case/#/  }
fi

if (( ${#misplaced} )); then
  print -r -- "apps/api/src 폴더 구조 규칙에 맞지 않는 폴더가 있다."
  print -rl -- ${misplaced/#/  }
  print -r -- ""
  print -r -- "허용하는 폴더:"
  print -r -- "  기능 폴더: {폴더명}.{${(j:, :)nest_file_kinds}}.ts 중 하나가 있는 폴더"
  print -r -- "  기능 폴더 안: ${(j:, :)role_folders}"
  print -r -- "  src/$shared_folder/ 안: ${(j:, :)shared_child_folders}"
  print -r -- "  src/ 아래 인프라 폴더: ${(j:, :)infra_paths}"
fi

(( ${#not_kebab_case} + ${#misplaced} == 0 ))
