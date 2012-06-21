%define _rootdir /opt/certifier

Name:          browserid-certifier
Version:       0.2012.05.25
Release:       1%{?dist}_%{rev}
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
for f in bin node_modules lib *.json; do
    cp -rp $f %{buildroot}%{_rootdir}/
done
mkdir -p %{buildroot}%{_rootdir}/config
cp config/local.json-dist %{buildroot}%{_rootdir}/config/local.json
mkdir -p %{buildroot}/etc/init.d
cp config/browserid-certifier %{buildroot}/etc/init.d/

%clean
rm -rf %{buildroot}

%files
%defattr(-,root,root,-)
%{_rootdir}
%config %{_rootdir}/config/local.json
/etc/init.d/browserid-certifier


%changelog
* Mon Jun 21 2012 David Caro <david.caro.estevez@gmail.com>
- Added init script
* Mon Jun 18 2012 David Caro <david.caro.estevez@gmail.com>
- Added a default config file and the required node modules to the installation
* Fri Jun  8 2012 Pete Fritchman <petef@mozilla.com>
- Initial version
