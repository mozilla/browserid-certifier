#!/bin/bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

usage()
{
    cat <<EOU
    Usage: $0 [-hv] [major]

    Creates an rpm package of the current version

    Options:
        -h
            Show this help
        -v
            Be verbose

    Parameters:
        major
            Major version to use, defaults to '0'


EOU
    exit ${1:-0}
}

get_ver_string()
{
    branch="$(git branch | grep '*')"
    branch="${branch:2}"
    describe_all="$(git describe --all --long)"
    describe_tags="$(git describe --tags --long 2>/dev/null)"
    [[ $? -ne 0 ]] \
    && {
        ## we have no reachable tags in the history, use the branch name
        echo "${describe_all#*/}"
        return
    }   
    [[ "${describe_tags%-*-*}" == "${describe_all#*/}" ]] \
    && {
        ## the tag we got with the describe is newer than the branch, use it
        echo "$describe_tags"
        return
    } || {
        ## Iep, we got a tag that is older than the current branch, use the
        ## branch name
        echo "${describe_all#*/}"
        return
    }   
}

get_ci_count()
{
    git log --oneline ${1:+$1..} --pretty='format:%h' | wc -l
}


#### MAIN

while getopts 'hv' option; do
    case $option in
        h) usage;;
        v) set -e;;
        *) usage 1;;
    esac
done
shift $((OPTIND - 1))

MAJOR=${1:-0}

progname=$(basename $0)

cd $(dirname $0)/..    # top level of the checkout

rm -rf rpmbuild/RPMS rpmbuild/SOURCES/browserid-certifier
mkdir -p rpmbuild/{BUILD,SOURCES,SPECS,SRPMS,RPMS/x86_64}

tar --exclude rpmbuild --exclude .git \
    --exclude var -czf \
    $PWD/rpmbuild/SOURCES/browserid-certifier.tar.gz .

set +e

ver_string="$(get_ver_string)"
ver="${ver_string%-*-*}"
rel="${ver_string:$((${#ver} + 1))}"
## the char '-' is not allowed in the version nor the release
rpmbuild --define "_topdir $PWD/rpmbuild" \
         --define "ver $MAJOR.${ver//-/_}" \
         --define "rel ${rel//-/.}" \
         --define "rev_locale $LOCALE_REV" \
         -ba scripts/browserid-certifier.spec
rc=$?
if [[ $rc -eq 0 ]]; then
    ls -l $PWD/rpmbuild/RPMS/*/*.rpm
else
    echo "$progname: failed to build certifier RPM (rpmbuild rc=$rc)" >&2
fi

exit $rc
