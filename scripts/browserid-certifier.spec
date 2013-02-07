%define _rootdir /opt/certifier

Name:          browserid-certifier
Version:       0.2013.02.14
Release:       2%{?dist}
Summary:       BrowserID Certifier
Packager:      Pete Fritchman <petef@mozilla.com>
Group:         Development/Libraries
License:       MPL 2.0
URL:           https://github.com/mozilla/browserid-certifier
Source0:       %{name}.tar.gz
BuildRoot:     %{_tmppath}/%{name}-%{version}-%{release}-root
AutoReqProv:   no
Requires:      openssl nodejs
BuildRequires: gcc-c++ git jre make npm openssl-devel expat-devel

%description
BrowserID Certifier: process to sign certificates.

%prep
%setup -q -c -n browserid-certifier

%build
npm install
export PATH=$PWD/node_modules/.bin:$PATH

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}%{_rootdir}
for f in bin lib node_modules *.json; do
    cp -rp $f %{buildroot}%{_rootdir}/
done
mkdir -p %{buildroot}%{_rootdir}/config

%clean
rm -rf %{buildroot}

%files
%defattr(-,root,root,-)
%{_rootdir}

%changelog
* Fri Jun  8 2012 Pete Fritchman <petef@mozilla.com>
- Initial version
