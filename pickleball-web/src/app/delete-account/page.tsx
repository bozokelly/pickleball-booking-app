import { redirect } from 'next/navigation';
import { accountDeletionPath } from '../(legal)/legalContent';

export default function DeleteAccountRedirectPage() {
  redirect(accountDeletionPath);
}
